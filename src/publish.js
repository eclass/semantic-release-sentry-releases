const getError = require('./get-error')
const { createRelease } = require('./request')
// @ts-ignore
const pkg = require('../package.json')

/**
 * @typedef {import('./types').Context} Context
 * @typedef {import('./types').Config} Config
 * @typedef {import('semantic-release').Commit} Commit
 * @typedef {import('./request').SentryReleaseParams} SentryReleaseParams
 * @typedef {import('./request').SentryReleaseSuccessResponse} SentryReleaseSuccessResponse
 */
/**
 * @param {Config} pluginConfig -
 * @param {Context} ctx -
 * @returns {Promise<SentryReleaseSuccessResponse>} -
 * @example
 * publish(pluginConfig, ctx)
 */
module.exports = async (pluginConfig, ctx) => {
  try {
    const url = pluginConfig.tagsUrl || ''
    /** @type {SentryReleaseParams} */
    const data = {
      commits: ctx.commits.map(commit => ({
        id: commit.hash,
        repository: pkg.repository,
        message: commit.message,
        author_name: commit.author.name,
        author_email: commit.author.email,
        timestamp: commit.committerDate
      })),
      version: ctx.nextRelease.version,
      projects: [ctx.env.SENTRY_PROJECT]
    }
    if (url !== '') data.url = url
    return await createRelease(data, ctx.env.SENTRY_TOKEN, ctx.env.SENTRY_ORG)
  } catch (err) {
    throw getError('ESENTRYDEPLOY', ctx)
  }
}
