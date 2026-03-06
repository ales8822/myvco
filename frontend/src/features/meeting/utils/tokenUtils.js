// frontend/src/features/meeting/utils/tokenUtils.js

/**
 * Estimates the number of tokens in a given string.
 * This is a heuristic approach using an average of 4 characters per token
 * for English text. It is fast and runs completely client-side.
 * 
 * @param {string} text - The input text
 * @returns {number} Estimated token count
 */
export function estimateTokenCount(text) {
    if (!text) return 0;
    // Heuristic: ~4 chars per token
    return Math.ceil(text.length / 4);
}
