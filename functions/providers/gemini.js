/**
 * Google Gemini Moderation Provider
 * Uses Gemini API for content analysis with a moderation prompt
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Moderation prompt - strict neutral language, structured output
 */
const MODERATION_PROMPT = `You are a content moderation system. Analyze the following text and return a JSON object with your assessment.

Evaluate for these categories:
- hate: Content expressing hatred toward groups based on identity
- harassment: Content that harasses or bullies individuals
- violence: Content promoting or depicting violence
- sexual: Explicit sexual content
- self_harm: Content promoting self-harm
- dangerous: Content promoting dangerous activities

Return ONLY a valid JSON object in this exact format:
{
  "flagged": boolean,
  "score": number between 0.0 and 1.0 representing overall toxicity,
  "categories": {
    "hate": boolean,
    "harassment": boolean,
    "violence": boolean,
    "sexual": boolean,
    "self_harm": boolean,
    "dangerous": boolean
  },
  "categoryScores": {
    "hate": number,
    "harassment": number,
    "violence": number,
    "sexual": number,
    "self_harm": number,
    "dangerous": number
  },
  "reason": "brief explanation if flagged, empty string if not"
}

Text to analyze:
"""
{TEXT}
"""`;

/**
 * Moderate content using Google Gemini
 * @param {string} text - Text to moderate
 * @param {string} apiKey - Gemini API key
 * @param {number} sensitivity - Sensitivity threshold (0.0-1.0)
 * @returns {Promise<ModerationResult>}
 */
export async function moderate(text, apiKey, sensitivity = 0.5) {
    if (!apiKey) {
        throw new Error("Gemini API key is required");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = MODERATION_PROMPT.replace("{TEXT}", text);

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = responseText;
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonStr.trim());

        // Apply sensitivity threshold
        const flaggedCategories = [];
        for (const [category, score] of Object.entries(parsed.categoryScores || {})) {
            if (score >= sensitivity) {
                flaggedCategories.push(category);
            }
        }

        const flagged = flaggedCategories.length > 0 || parsed.flagged;

        return {
            flagged,
            score: parsed.score || 0,
            categories: parsed.categories || {},
            categoryScores: parsed.categoryScores || {},
            provider: "gemini",
            reason: flagged ? (parsed.reason || `Content flagged for: ${flaggedCategories.join(", ")}`) : "",
        };
    } catch (error) {
        throw new Error(`Gemini moderation error: ${error.message}`);
    }
}

export default { moderate };
