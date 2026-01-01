This extension evaluates user-generated text content in Firestore documents using AI-based analysis. When a new document is created in the specified collection, the extension reads the configured text field and sends it to the selected AI provider for evaluation. Based on the results and your configuration, the extension can flag, hide, or delete content that exceeds the sensitivity threshold.

The extension supports three AI providers: OpenAI Moderation API, Google Gemini, and a local rules-based approach using blocklist matching. Each provider returns a standardized moderation result that is written to the document.

## How It Works

1. A new document is created in the monitored Firestore collection.
2. The extension reads the text from the configured field.
3. The text is sent to the configured AI provider for evaluation.
4. The moderation result is written to the document in the configured output field.
5. If the content is flagged and the action is set to "hide" or "delete", the corresponding action is applied.

## Supported AI Providers

| Provider | API Required | Description |
|----------|--------------|-------------|
| OpenAI Moderation | Yes | Sends text to OpenAI Moderation API endpoint |
| Google Gemini | Yes | Sends text to Gemini API with a moderation prompt |
| Local Rules | No | Matches text against a configurable blocklist |

## Document Structure

Input documents should contain a text field:

```json
{
  "text": "User-generated content",
  "author": "user123"
}
```

After processing, documents include a moderation field:

```json
{
  "text": "User-generated content",
  "moderation": {
    "processed": true,
    "version": "0.0.1",
    "status": "approved",
    "flagged": false,
    "score": 0.02,
    "provider": "openai",
    "timestamp": "..."
  }
}
```

## Setup Requirements

Before installing this extension:

1. Set up Cloud Firestore in your Firebase project.
2. Obtain an API key for your chosen provider (OpenAI or Gemini), if applicable.

## Costs

To install an extension, your project must be on the Blaze (pay as you go) plan.

This extension uses the following services:

| Service | Cost |
|---------|------|
| Cloud Functions | Per invocation, see Firebase pricing |
| Cloud Firestore | Per document read/write, see Firebase pricing |
| OpenAI Moderation API | Currently free, see OpenAI pricing |
| Google Gemini API | Per request, see Google AI pricing |
| Local rules provider | No external API costs |
| Eventarc (if enabled) | Per event, see Eventarc pricing |

## Security and Permissions

This extension requires the following IAM role:

- `roles/datastore.user` - Read and write access to Firestore documents in the configured collection.

The extension does not require access to other Firebase services or external resources beyond the configured AI provider API.

API keys for OpenAI and Gemini are stored as Firebase secrets and are not exposed in logs or client-side code.

## Limitations

- The extension only processes documents created after installation. Use the backfill option to process existing documents.
- The extension monitors a single collection path. To monitor multiple collections, install multiple instances.
- The local rules provider only supports exact word matching, not pattern matching or semantic analysis.
- Documents without a text field or with non-string values in the text field are skipped.
- The extension does not support real-time updates to existing documents. It only triggers on document creation.
- Rate limits of the selected AI provider may affect processing speed for high-volume collections.
