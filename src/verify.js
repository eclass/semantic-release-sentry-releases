const { URL } = require('url')
const AggregateError = require('aggregate-error')
const getError = require('./get-error')
const { verify } = require('./request')

/**
 * @param {string} url -
 * @returns {boolean} -
 * @example
 * isValidUrl(url)
 */
const isValidUrl = url => {
  try {
    // eslint-disable-next-line no-unused-vars
    const { href } = new URL(url)
    return true
  } catch (err) {
    return false
  }
}

/**
 * @param {Config} pluginConfig -
 * @param {Context} ctx -
 * @param {string} org -
 * @param {string} url -
 * @returns {Array<Error>} -
 * @example
 * getErrors(pluginConfig, ctx, org, url)
 */
const getErrors = (pluginConfig, ctx, org, url) => {
  const errors = []
  if (!ctx.env.SENTRY_AUTH_TOKEN) {
    errors.push(getError('ENOSENTRYTOKEN', ctx))
  }
  if (!org) {
    errors.push(getError('ENOSENTRYORG', ctx))
  }
  if (!isValidUrl(url)) {
    errors.push(getError('EINVALIDSENTRYURL', ctx))
  }
  if (!ctx.env.SENTRY_PROJECT && !pluginConfig.project) {
    errors.push(getError('ENOSENTRYPROJECT', ctx))
  }
  if (pluginConfig.tagsUrl && !isValidUrl(pluginConfig.tagsUrl)) {
    errors.push(getError('EINVALIDTAGSURL', ctx))
  }
  return errors
}

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
    const org = ctx.env.SENTRY_ORG || pluginConfig.org
    const url = ctx.env.SENTRY_URL || pluginConfig.url || 'https://sentry.io/'
    const errors = getErrors(pluginConfig, ctx, org, url)
    if (errors.length > 0) {
      throw new AggregateError(errors)
    }
    return await verify(ctx.env.SENTRY_AUTH_TOKEN, org, url)
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
