/**
 * Firebase Extension: AI Content Moderation
 * Evaluates user-generated text in Firestore and applies moderation
 * 
 * @version 0.0.1
 */

import { firestore, logger, tasks } from "firebase-functions/v1";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getEventarc } from "firebase-admin/eventarc";
import { getExtensions } from "firebase-admin/extensions";
import { getFunctions } from "firebase-admin/functions";

import { moderateContent as moderateText } from "./providers/index.js";

// Extension version for idempotency guard
const EXTENSION_VERSION = "0.1.0";

// Initialize Firebase Admin
const app = initializeApp();
const db = getFirestore();

// Configuration from environment
const config = {
  collectionPath: process.env.COLLECTION_PATH,
  textField: process.env.TEXT_FIELD,
  moderationField: process.env.MODERATION_FIELD || "moderation",
  provider: process.env.AI_PROVIDER,
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  blocklistWords: process.env.BLOCKLIST_WORDS || "",
  action: process.env.MODERATION_ACTION || "flag",
  sensitivity: process.env.SENSITIVITY || "0.5",
  enableEvents: process.env.ENABLE_EVENTS === "true",
  doBackfill: process.env.DO_BACKFILL === "true",
};

/**
 * IDEMPOTENCY GUARD
 * Skip documents that have already been processed by this version
 * Uses processed flag + version check for future-proofing
 */
function shouldSkipModeration(data) {
  const moderation = data[config.moderationField];

  if (!moderation) {
    return false; // No moderation yet, process it
  }

  // Skip if already processed by this or newer version
  if (moderation.processed === true && moderation.version === EXTENSION_VERSION) {
    return true;
  }

  return false;
}

/**
 * Initialize Eventarc channel if events are enabled
 */
function getEventChannel() {
  // Check if events are enabled via config
  if (!config.enableEvents) {
    return null;
  }

  // Check if Eventarc channel is configured
  if (!process.env.EVENTARC_CHANNEL) {
    return null;
  }

  return getEventarc().channel(process.env.EVENTARC_CHANNEL, {
    allowedEventTypes: process.env.EXT_SELECTED_EVENTS,
  });
}

/**
 * Publish moderation event (only if enabled)
 */
async function publishEvent(eventChannel, type, docPath, result) {
  if (!eventChannel) return;

  try {
    await eventChannel.publish({
      type,
      subject: docPath,
      data: {
        documentPath: docPath,
        ...result,
      },
    });
  } catch (error) {
    logger.error("Failed to publish event", error);
  }
}

/**
 * Apply moderation action to document
 * Returns standardized moderation output object
 */
async function applyModerationAction(docRef, result) {
  const timestamp = FieldValue.serverTimestamp();

  // Standardized moderation output object with versioned guard
  const moderationData = {
    [config.moderationField]: {
      processed: true,
      version: EXTENSION_VERSION,
      status: result.flagged ? "flagged" : "approved",
      flagged: result.flagged,
      score: result.score,
      provider: result.provider,
      reason: result.reason,
      categories: result.categories,
      timestamp,
    },
  };

  switch (config.action) {
    case "delete":
      if (result.flagged) {
        logger.info(`Deleting flagged document: ${docRef.path}`);
        await docRef.delete();
        return { action: "deleted" };
      }
      await docRef.update(moderationData);
      return { action: "approved" };

    case "hide":
      if (result.flagged) {
        moderationData.hidden = true;
      }
      await docRef.update(moderationData);
      return { action: result.flagged ? "hidden" : "approved" };

    case "flag":
    default:
      await docRef.update(moderationData);
      return { action: result.flagged ? "flagged" : "approved" };
  }
}

/**
 * Main moderation function - triggered on new documents
 */
export const moderateContent_fn = firestore
  .document(`${config.collectionPath}/{docId}`)
  .onCreate(async (snapshot, context) => {
    const docId = context.params.docId;
    const docPath = snapshot.ref.path;
    const data = snapshot.data();

    logger.info(`Processing new document: ${docPath}`);

    // IDEMPOTENCY GUARD: Skip if already processed
    if (shouldSkipModeration(data)) {
      logger.info(`Skipping already processed document: ${docPath}`);
      return null;
    }

    // Get text content
    const text = data[config.textField];
    if (!text || typeof text !== "string") {
      logger.warn(`No text found in field "${config.textField}" for document: ${docPath}`);
      // Mark as skipped with version
      await snapshot.ref.update({
        [config.moderationField]: {
          processed: true,
          version: EXTENSION_VERSION,
          status: "skipped",
          reason: "No text content found",
          timestamp: FieldValue.serverTimestamp(),
        },
      });
      return null;
    }

    try {
      // Run moderation
      logger.info(`Evaluating content with ${config.provider} provider`);
      const result = await moderateText(text, config);

      logger.info(`Moderation result: flagged=${result.flagged}, score=${result.score}`);

      // Apply action
      const actionResult = await applyModerationAction(snapshot.ref, result);

      // Publish events (only if enabled)
      const eventChannel = getEventChannel();
      if (eventChannel) {
        await publishEvent(
          eventChannel,
          "firebase.extensions.firestore-ai-content-moderation.v1.moderated",
          docPath,
          { ...result, action: actionResult.action }
        );

        if (result.flagged) {
          await publishEvent(
            eventChannel,
            "firebase.extensions.firestore-ai-content-moderation.v1.flagged",
            docPath,
            result
          );
        }
      }

      return result;
    } catch (error) {
      logger.error(`Moderation failed for ${docPath}:`, error);

      // Mark as error with version
      await snapshot.ref.update({
        [config.moderationField]: {
          processed: true,
          version: EXTENSION_VERSION,
          status: "error",
          error: error.message,
          timestamp: FieldValue.serverTimestamp(),
        },
      });

      throw error;
    }
  });

// Export with the name expected by extension.yaml
export { moderateContent_fn as moderateContent };

/**
 * Backfill moderation for existing documents
 * Lifecycle event handler - runs on install
 */
export const backfillModeration = tasks.taskQueue().onDispatch(async (data) => {
  // Check if backfill is enabled
  if (!config.doBackfill) {
    logger.info("Backfill disabled by configuration");
    return getExtensions()
      .runtime()
      .setProcessingState("PROCESSING_COMPLETE", "Backfill skipped per configuration.");
  }

  const BATCH_SIZE = 20;
  const startAfter = data?.startAfter || null;

  logger.info(`Starting backfill batch, startAfter: ${startAfter}`);

  // Query documents
  let query = db
    .collection(config.collectionPath)
    .limit(BATCH_SIZE);

  if (startAfter) {
    const startDoc = await db.doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();

  if (snapshot.empty) {
    logger.info("Backfill complete - no more documents");
    return getExtensions()
      .runtime()
      .setProcessingState("PROCESSING_COMPLETE", "Backfill complete.");
  }

  let processed = 0;
  let lastDocPath = null;

  for (const doc of snapshot.docs) {
    const docData = doc.data();

    // Skip if already processed (versioned check)
    if (shouldSkipModeration(docData)) {
      lastDocPath = doc.ref.path;
      continue;
    }

    const text = docData[config.textField];
    if (!text || typeof text !== "string") {
      lastDocPath = doc.ref.path;
      continue;
    }

    try {
      const result = await moderateText(text, config);
      await applyModerationAction(doc.ref, result);
      processed++;
      logger.info(`Processed document: ${doc.ref.path}`);
    } catch (error) {
      logger.error(`Processing failed for ${doc.ref.path}:`, error);
    }

    lastDocPath = doc.ref.path;
  }

  logger.info(`Batch complete: processed ${processed} documents`);

  // Queue next batch if we got a full batch
  if (snapshot.docs.length === BATCH_SIZE) {
    const queue = getFunctions().taskQueue(
      "backfillModeration",
      process.env.EXT_INSTANCE_ID
    );
    await queue.enqueue({ startAfter: lastDocPath });
    logger.info(`Queued next batch starting after: ${lastDocPath}`);
    return;
  }

  return getExtensions()
    .runtime()
    .setProcessingState("PROCESSING_COMPLETE", `Backfill complete. Processed ${processed} documents in final batch.`);
});
