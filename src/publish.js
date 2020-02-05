const getError = require('./get-error')
const { createRelease, createDeploy } = require('./request')

/**
 * @typedef {import('./types').Context} Context
 * @typedef {import('./types').Config} Config
 * @typedef {import('semantic-release').Commit} Commit
 * @typedef {import('./request').SentryReleaseParams} SentryReleaseParams
 * @typedef {import('./request').SentryDeployParams} SentryDeployParams
 * @typedef {import('./request').SentryReleaseSuccessResponse} SentryReleaseSuccessResponse
 * @typedef {import('./request').SentryDeploySuccessResponse} SentryDeploySuccessResponse
 */
/**
 * @typedef {Object} PublishResult
 * @property {SentryReleaseSuccessResponse} release
 * @property {SentryDeploySuccessResponse} deploy
 */
/**
 * @param {Config} pluginConfig -
 * @param {Context} ctx -
 * @returns {Promise<PublishResult>} -
 * @example
 * publish(pluginConfig, ctx)
 */
module.exports = async (pluginConfig, ctx) => {
  try {
    const url = pluginConfig.tagsUrl || ''
    /** @type {SentryReleaseParams} */
    const releaseDate = {
      commits: ctx.commits.map(commit => {
        const newCommit = {
          id: commit.hash,
          message: commit.message,
          author_name: commit.author.name,
          author_email: commit.author.email,
          timestamp: commit.committerDate
        }
        if (pluginConfig.repositoryUrl) {
          newCommit.repository = pluginConfig.repositoryUrl
        }
        return newCommit
      }),
      version: ctx.nextRelease.version,
      projects: [ctx.env.SENTRY_PROJECT]
    }
    if (url !== '') releaseDate.url = url
    const release = await createRelease(
      releaseDate,
      ctx.env.SENTRY_AUTH_TOKEN,
      ctx.env.SENTRY_ORG
    )
    /** @type {SentryDeployParams} */
    const deployData = {
      environment: pluginConfig.environment || 'production'
    }
    if (pluginConfig.deployName) {
      deployData.name = pluginConfig.deployName
    }
    if (pluginConfig.deployUrl) {
      deployData.name = pluginConfig.deployUrl
    }
    if (ctx.env.DEPLOY_START) {
      deployData.dateStarted = ctx.env.DEPLOY_START
    }
    if (ctx.env.DEPLOY_END) {
      deployData.dateStarted = ctx.env.DEPLOY_END
    }
    const deploy = await createDeploy(
      deployData,
      ctx.env.SENTRY_AUTH_TOKEN,
      ctx.env.SENTRY_ORG,
      ctx.nextRelease.version
    )
    return { release, deploy }
  } catch (err) {
    throw getError('ESENTRYDEPLOY', ctx)
  }
}
