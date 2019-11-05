/**
 * @typedef {import('semantic-release').Context} Context
 */
/**
 * @typedef {Object} SemanticReleaseError
 * @property {string} message -
 * @property {string} details -
 */

module.exports = new Map([
  [
    'CUSTOMERROR',
    /**
     * @param {Context} ctx -
     * @returns {SemanticReleaseError} -
     */
    (ctx) => ({
      message: 'A custom message.',
      details: 'A custom description.'
    })
  ]
])
