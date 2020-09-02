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
 * @returns {SentryDeployParams} -
 * @example
 * getDeployData(pluginConfig, ctx)
 */
const getDeployData = (pluginConfig, ctx) => {
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
  return deployData
}
/**
 * @param {Config} pluginConfig -
 * @param {Context} ctx -
 * @returns {Promise<PublishResult>} -
 * @example
 * publish(pluginConfig, ctx)
 */
module.exports = async (pluginConfig, ctx) => {
  try {
    const tagsUrl = pluginConfig.tagsUrl || ''
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
        } else if (
          !pluginConfig.repositoryUrl &&
          pluginConfig.usePackageRepositoryUrl === true &&
          ctx.options.repositoryUrl
        ) {
          newCommit.repository = ctx.options.repositoryUrl
        }
        return newCommit
      }),
      version: ctx.nextRelease.version,
      projects: [project]
    }
    if (tagsUrl !== '') {
      releaseDate.url = `${tagsUrl}/v${ctx.nextRelease.version}`
    }
    const org = ctx.env.SENTRY_ORG || pluginConfig.org
    const url = ctx.env.SENTRY_URL || pluginConfig.url || 'https://sentry.io/'
    ctx.logger.log('Creating release %s', ctx.nextRelease.version)
    const release = await createRelease(
      releaseDate,
      ctx.env.SENTRY_AUTH_TOKEN,
      org,
      url
    )
    ctx.logger.log('Release created')
    process.env.SENTRY_ORG = org
    process.env.SENTRY_URL = url
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
    const deployData = getDeployData(pluginConfig, ctx)
    ctx.logger.log('Creating deploy for release %s', ctx.nextRelease.version)
    const deploy = await createDeploy(
      deployData,
      ctx.env.SENTRY_AUTH_TOKEN,
      org,
      url,
      ctx.nextRelease.version
    )
    ctx.logger.log('Deploy created')
    return { release, deploy }
  } catch (err) {
    ctx.logger.error(err)
    throw getError('ESENTRYDEPLOY', ctx)
  }
}
