/**
 * @typedef {import('semantic-release').Context} Context
 * @typedef {import('semantic-release').Config} Config
 */
/**
 * @param {Config} pluginConfig -
 * @param {Context} ctx -
 * @returns {*} -
 * @example
 * publish(pluginConfig, ctx)
 */
module.exports = (pluginConfig, ctx) => {
  ctx.logger.log('Deploy')
}
