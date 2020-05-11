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
    if (!ctx.env.SENTRY_AUTH_TOKEN) {
      errors.push(getError('ENOSENTRYTOKEN', ctx))
    }
    const org = ctx.env.SENTRY_ORG || pluginConfig.org
    if (!org) {
      errors.push(getError('ENOSENTRYORG', ctx))
    }
    const hostname = ctx.env.SENTRY_HOSTNAME || pluginConfig.org || 'sentry.io'
    if (!hostname) {
      errors.push(getError('ENOSENTRYHOSTNAME', ctx))
    }
    if (!ctx.env.SENTRY_PROJECT && !pluginConfig.project) {
      errors.push(getError('ENOSENTRYPROJECT', ctx))
    }
    if (pluginConfig.tagsUrl && !/http/.test(pluginConfig.tagsUrl)) {
      errors.push(getError('EINVALIDTAGSURL', ctx))
    }
    if (errors.length > 0) {
      throw new AggregateError(errors)
    }
    return await verify(ctx.env.SENTRY_AUTH_TOKEN, org, hostname)
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
