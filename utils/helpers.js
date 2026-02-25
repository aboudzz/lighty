/**
 * Escapes special regex characters in a string for safe use in new RegExp()
 * @param {string} str - The string to escape
 * @returns {string} Escaped string
 */
const escapeRegExp = (str) => str.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

module.exports = { escapeRegExp };
