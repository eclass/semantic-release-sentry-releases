const AggregateError = require('aggregate-error')
const getError = require('./get-error')
const { verify } = require('./request')

/**
 * @typedef {import('./types').Context} Context
 * @typedef {import('./types').Config} Config
 */
/**
 * @param {Config} pluginConfig -
 * @param {Context} ctx -
 * @returns {Promise<*>} -
 * @example
 * verifyConditions(pluginConfig, ctx)
 */
module.exports = async (pluginConfig, ctx) => {
  try {
    const errors = []
    if (!ctx.env.SENTRY_TOKEN) {
      errors.push(getError('ENOSENTRYTOKEN', ctx))
    }
    if (!ctx.env.SENTRY_ORG) {
      errors.push(getError('ENOSENTRYORG', ctx))
    }
    if (!ctx.env.SENTRY_PROJECT) {
      errors.push(getError('ENOSENTRYPROJECT', ctx))
    }
    if (pluginConfig.tagsUrl && !/http/.test(pluginConfig.tagsUrl)) {
      errors.push(getError('EINVALIDTAGSURL', ctx))
    }
    if (errors.length > 0) {
      throw new AggregateError(errors)
    }
    return await verify(ctx.env.SENTRY_TOKEN, ctx.env.SENTRY_ORG)
  } catch (err) {
    if (err instanceof AggregateError) {
      throw err
    } else if (/401/.test(err.message)) {
      throw getError('EINVALIDSENTRYTOKEN', ctx)
    } else if (/404/.test(err.message)) {
      throw getError('EINVALIDSENTRYORG', ctx)
    } else {
      throw getError('ESENTRYDEPLOY', ctx)
    }
  }
}
