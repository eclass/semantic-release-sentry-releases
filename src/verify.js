const getError = require('./get-error')

/**
 * @typedef {import('semantic-release').Context} Context
 * @typedef {import('semantic-release').Config} Config
 */
/**
 * @param {Config} pluginConfig -
 * @param {Context} ctx -
 * @returns {*} -
 * @example
 * verifyConditions(pluginConfig, ctx)
 */
module.exports = (pluginConfig, ctx) => {
  if (!ctx.env.CUSTOM_ENV) {
    throw getError('CUSTOMERROR')
  }
}
