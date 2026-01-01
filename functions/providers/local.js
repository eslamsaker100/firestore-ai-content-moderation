/**
 * Local Rules-Based Moderation Provider
 * Fast, free, private - no external API calls
 */

/**
 * Default blocklist patterns (common inappropriate terms)
 * Users can extend this via configuration
 */
const DEFAULT_PATTERNS = [
    // Placeholder patterns - users should configure their own blocklist
];

/**
 * Moderate content using local rules
 * @param {string} text - Text to moderate
 * @param {string} blocklist - Comma-separated blocklist words from config
 * @param {number} sensitivity - Not used for local rules, included for API consistency
 * @returns {Promise<ModerationResult>}
 */
export async function moderate(text, blocklist = "", sensitivity = 0.5) {
    const normalizedText = text.toLowerCase();

    // Parse user-provided blocklist
    const userBlocklist = blocklist
        .split(",")
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word.length > 0);

    // Combine with default patterns
    const allPatterns = [...DEFAULT_PATTERNS, ...userBlocklist];

    // Check for matches
    const matches = [];
    for (const pattern of allPatterns) {
        if (pattern.length > 0 && normalizedText.includes(pattern)) {
            matches.push(pattern);
        }
    }

    // Check for excessive caps (potential shouting)
    const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1);
    const excessiveCaps = text.length > 10 && capsRatio > 0.7;

    // Check for repeated characters (potential spam)
    const repeatedChars = /(.)\1{4,}/.test(text);

    // Calculate score based on findings
    let score = 0;
    const categories = {
        blocklist: matches.length > 0,
        excessive_caps: excessiveCaps,
        spam_patterns: repeatedChars,
    };

    if (matches.length > 0) score += 0.6;
    if (excessiveCaps) score += 0.2;
    if (repeatedChars) score += 0.2;

    score = Math.min(score, 1.0);

    const flagged = score >= sensitivity;

    // Build reason
    const reasons = [];
    if (matches.length > 0) reasons.push(`blocked terms detected`);
    if (excessiveCaps) reasons.push("excessive capitalization");
    if (repeatedChars) reasons.push("spam patterns detected");

    return {
        flagged,
        score,
        categories,
        categoryScores: {
            blocklist: matches.length > 0 ? 0.8 : 0,
            excessive_caps: excessiveCaps ? 0.4 : 0,
            spam_patterns: repeatedChars ? 0.3 : 0,
        },
        provider: "local",
        reason: flagged ? reasons.join("; ") : "",
        matches, // Include matched terms for debugging
    };
}

export default { moderate };
