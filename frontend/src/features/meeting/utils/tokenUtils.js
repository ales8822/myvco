// frontend/src/features/meeting/utils/tokenUtils.js

/**
 * Estimates the number of tokens in a given string.
 * This is a heuristic approach using an average of 4 characters per token
 * for English text. It is fast and runs completely client-side.
 * 
 * @param {string} text - The input text
 * @param {Array<string>} [images=[]] - Array of image URLs or file objects
 * @returns {number} Estimated token count
 */
export function estimateTokenCount(text, images = []) {
    let count = 0;
    if (text) {
        // Heuristic: ~4 chars per token for text
        count += Math.ceil(text.length / 4);
    }
    
    // Heuristic: 258 baseline tokens per image (Gemini Vision standard limit)
    if (images && images.length > 0) {
        count += (images.length * 258);
    }
    
    return count;
}
