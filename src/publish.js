const path = require('path')
const SentryCli = require('@sentry/cli')
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
    const project = ctx.env.SENTRY_PROJECT || pluginConfig.project
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
      projects: [project]
    }
    if (url !== '') releaseDate.url = `${url}/v${ctx.nextRelease.version}`
    const org = ctx.env.SENTRY_ORG || pluginConfig.org || 'sentry.io'
    const hostname = ctx.env.SENTRY_HOSTNAME || pluginConfig.hostname
    ctx.logger.log('Creating release %s', ctx.nextRelease.version)
    const release = await createRelease(
      releaseDate,
      ctx.env.SENTRY_AUTH_TOKEN,
      org,
      hostname
    )
    ctx.logger.log('Release created')
    process.env.SENTRY_ORG = org
    process.env.SENTRY_HOSTNAME = hostname
    process.env.SENTRY_PROJECT = project
    const cli = new SentryCli()
    if (pluginConfig.sourcemaps && pluginConfig.urlPrefix) {
      const sourcemaps = path.resolve(ctx.cwd, pluginConfig.sourcemaps)
      ctx.logger.log('Uploading sourcemaps from %s', sourcemaps)
      await cli.releases.uploadSourceMaps(ctx.nextRelease.version, {
        include: [sourcemaps],
        urlPrefix: pluginConfig.urlPrefix,
        rewrite: pluginConfig.rewrite || false
      })
      ctx.logger.log('Sourcemaps uploaded')
    }
    /** @type {SentryDeployParams} */
    const deployData = {
      environment: pluginConfig.environment || 'production'
    }
    if (pluginConfig.deployName) {
      deployData.name = pluginConfig.deployName
    }
    if (pluginConfig.deployUrl) {
      deployData.url = pluginConfig.deployUrl
    }
    if (ctx.env.DEPLOY_START) {
      deployData.dateStarted = ctx.env.DEPLOY_START
    }
    if (ctx.env.DEPLOY_END) {
      deployData.dateStarted = ctx.env.DEPLOY_END
    }
    ctx.logger.log('Creating deploy for release %s', ctx.nextRelease.version)
    const deploy = await createDeploy(
      deployData,
      ctx.env.SENTRY_AUTH_TOKEN,
      org,
      hostname,
      ctx.nextRelease.version
    )
    ctx.logger.log('Deploy created')
    return { release, deploy }
  } catch (err) {
    ctx.logger.error(err)
    throw getError('ESENTRYDEPLOY', ctx)
  }
}
