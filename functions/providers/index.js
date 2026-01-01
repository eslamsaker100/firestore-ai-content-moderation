/**
 * Provider Factory
 * Returns the appropriate moderation provider based on configuration
 */

import * as openai from "./openai.js";
import * as gemini from "./gemini.js";
import * as local from "./local.js";

/**
 * Get the moderation function for the configured provider
 * @param {string} providerName - Provider name from config
 * @returns {Object} Provider module with moderate function
 */
export function getProvider(providerName) {
    switch (providerName) {
        case "openai":
            return openai;
        case "gemini":
            return gemini;
        case "local":
            return local;
        default:
            throw new Error(`Unknown AI provider: ${providerName}`);
    }
}

/**
 * Moderate content using the configured provider
 * @param {string} text - Text to moderate
 * @param {Object} config - Configuration object
 * @returns {Promise<ModerationResult>}
 */
export async function moderateContent(text, config) {
    const provider = getProvider(config.provider);
    const sensitivity = parseFloat(config.sensitivity) || 0.5;

    switch (config.provider) {
        case "openai":
            return provider.moderate(text, config.openaiApiKey, sensitivity);
        case "gemini":
            return provider.moderate(text, config.geminiApiKey, sensitivity);
        case "local":
            return provider.moderate(text, config.blocklistWords, sensitivity);
        default:
            throw new Error(`Unknown provider: ${config.provider}`);
    }
}

export default { getProvider, moderateContent };
