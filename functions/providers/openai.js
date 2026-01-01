/**
 * OpenAI Moderation Provider
 * Uses OpenAI's free Moderation API for content analysis
 */

/**
 * Standardized moderation result object
 * @typedef {Object} ModerationResult
 * @property {boolean} flagged - Whether the content was flagged
 * @property {number} score - Overall toxicity score (0.0-1.0)
 * @property {Object} categories - Category-specific flags
 * @property {Object} categoryScores - Category-specific scores
 * @property {string} provider - Provider name
 * @property {string} reason - Human-readable reason if flagged
 */

const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";

/**
 * Moderate content using OpenAI Moderation API
 * @param {string} text - Text to moderate
 * @param {string} apiKey - OpenAI API key
 * @param {number} sensitivity - Sensitivity threshold (0.0-1.0)
 * @returns {Promise<ModerationResult>}
 */
export async function moderate(text, apiKey, sensitivity = 0.5) {
    if (!apiKey) {
        throw new Error("OpenAI API key is required");
    }

    const response = await fetch(OPENAI_MODERATION_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            input: text,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const result = data.results[0];

    // Calculate overall score as max of all category scores
    const categoryScores = result.category_scores;
    const maxScore = Math.max(...Object.values(categoryScores));

    // Determine which categories exceeded threshold
    const flaggedCategories = [];
    for (const [category, score] of Object.entries(categoryScores)) {
        if (score >= sensitivity) {
            flaggedCategories.push(category);
        }
    }

    const flagged = flaggedCategories.length > 0 || result.flagged;

    // Build human-readable reason
    let reason = "";
    if (flagged && flaggedCategories.length > 0) {
        reason = `Content flagged for: ${flaggedCategories.join(", ")}`;
    }

    return {
        flagged,
        score: maxScore,
        categories: result.categories,
        categoryScores: result.category_scores,
        provider: "openai",
        reason,
    };
}

export default { moderate };
