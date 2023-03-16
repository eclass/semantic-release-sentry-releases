const { EventEmitter } = require('events')
const path = require('path')
const { describe, it, beforeEach } = require('mocha')
const { expect } = require('chai')
const nock = require('nock')
const tempWrite = require('temp-write')
const mock = require('mock-require')

// eslint-disable-next-line require-jsdoc
const gitDiffTree = (repoPath, options) => {
  const event = new EventEmitter()
  setTimeout(() => {
    event.emit('data', 'raw', { toFile: 'index.js', status: 'A' })
    event.emit('end')
  }, 200)
  return event
}
mock('git-diff-tree', gitDiffTree)

const publish = require('../src/publish')

// eslint-disable-next-line require-jsdoc
const getCwd = () => {
  const filePath = tempWrite.sync('sourcemaps', 'dist/app.js.map')
  const sourcemaps = path.dirname(filePath)
  const cwd = path.dirname(sourcemaps)
  return { cwd, sourcemaps }
}

describe('Publish', () => {
  /** @type {import('../src/types').Context} */
  const ctx = {
    env: {
      SENTRY_ORG: 'valid',
      SENTRY_PROJECT: 'error',
      SENTRY_AUTH_TOKEN: 'valid',
      SENTRY_ENVIRONMENT: 'environment',
    },
    commits: [
      {
        hash: 'bb3dedcb1fbbd8ffa8fc75d082ea91340a4c7aa7',
        message: 'fix(js): fix request',
        author: { name: 'me', email: 'me@me.me', short: '' },
        committerDate: new Date().toISOString(),
        commit: { long: '', short: '' },
        tree: { long: '', short: '' },
        body: '',
        committer: { name: 'me', email: 'me@me.me', short: '' },
        subject: '',
      },
    ],
    nextRelease: {
      version: '1.0.0',
      gitTag: 'v1.0.0',
      type: 'major',
      gitHead: '',
      notes: '',
    },
    logger: { log: () => ({}), error: () => ({}) },
    options: {
      repositoryUrl:
        'https://github.com/eclass/semantic-release-sentry-releases.git',
      branches: '',
      plugins: [],
      tagFormat: '',
    },
  }
  const SENTRY_HOST = 'https://sentry.io'
  const tagsUrl = 'https://myreleases/'
  const PATH_RELEASE = '/api/0/organizations/valid/releases/'
  const NOCK_OPTIONS = { reqheaders: { authorization: 'Bearer valid' } }
  const SERVER_ERROR_TITLE =
    'Return SemanticReleaseError if a get a error from sentry'

  beforeEach(() => {
    nock.disableNetConnect()
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .get('/api/0/organizations/valid/repos/')
      .reply(200, [
        {
          id: '1',
          name: 'eclass / semantic-release-sentry-releases',
          url: 'github.com/eclass/semantic-release-sentry-releases',
          provider: {
            id: 'integrations:github',
            name: 'Github',
          },
          status: 'active',
          dateCreated: '2020-10-30T20:05:57.053153Z',
          integrationId: '1',
          externalSlug: 1,
        },
      ])
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .post(PATH_RELEASE, (body) => body.projects.includes('error'))
      .reply(400, {
        commits: {
          repository: ['Ensure this field has no more than 64 characters.'],
        },
      })
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .post(PATH_RELEASE, (body) => body.projects.includes('error'))
      .reply(500)
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .post(PATH_RELEASE, (body) => body.projects.includes('server'))
      .replyWithError('server error')
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .post(PATH_RELEASE, (body) => body.projects.includes('invalid'))
      .reply(201, 'success')
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .post(PATH_RELEASE)
      .reply(201, {
        authors: [],
        commitCount: 0,
        data: {},
        dateCreated: new Date().toISOString(),
        dateReleased: null,
        deployCount: 0,
        firstEvent: null,
        lastCommit: null,
        lastDeploy: null,
        lastEvent: null,
        newGroups: 0,
        owner: null,
        projects: [
          {
            name: 'project',
            slug: 'project',
          },
        ],
        ref: '6ba09a7c53235ee8a8fa5ee4c1ca8ca886e7fdbb',
        shortVersion: '1.0.0',
        url: null,
        version: '1.0.0',
      })
      .post('/api/0/organizations/valid/releases/1.0.0/files/')
      .reply(201)
      .post('/api/0/organizations/valid/releases/1.0.0/deploys/')
      .reply(201, {
        name: 'amazon',
        url: 'https://api.example.com/',
        environment: ctx.env.SENTRY_ENVIRONMENT,
        dateStarted: '2020-02-05T10:29:59Z',
        dateFinished: '2020-02-05T10:30:43Z',
        id: '5044917',
      })

    nock(SENTRY_HOST, NOCK_OPTIONS)
      .post(PATH_RELEASE)
      .reply(201, {
        authors: [],
        commitCount: 0,
        data: {},
        dateCreated: new Date().toISOString(),
        dateReleased: null,
        deployCount: 0,
        firstEvent: null,
        lastCommit: null,
        lastDeploy: null,
        lastEvent: null,
        newGroups: 0,
        owner: null,
        projects: [
          {
            name: 'project',
            slug: 'project',
          },
        ],
        ref: '6ba09a7c53235ee8a8fa5ee4c1ca8ca886e7fdbb',
        shortVersion: 'web1-1.0.0',
        url: null,
        version: 'web1-1.0.0',
      })
      .post('/api/0/organizations/valid/releases/web1-1.0.0/deploys/')
      .reply(201, {
        name: 'amazon',
        url: 'https://api.example.com/',
        environment: 'production',
        dateStarted: '2020-02-05T10:29:59Z',
        dateFinished: '2020-02-05T10:30:43Z',
        id: '5044917',
      })
  })

  it(SERVER_ERROR_TITLE, async () => {
    try {
      const { cwd } = getCwd()
      ctx.cwd = cwd
      // @ts-ignore
      await publish({ tagsUrl: '' }, ctx)
    } catch (err) {
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('ESENTRYDEPLOY')
    }
  })

  it(SERVER_ERROR_TITLE, async () => {
    try {
      const { cwd } = getCwd()
      ctx.cwd = cwd
      // @ts-ignore
      await publish({ tagsUrl: '' }, ctx)
    } catch (err) {
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('ESENTRYDEPLOY')
    }
  })

  it(SERVER_ERROR_TITLE, async () => {
    try {
      const { cwd } = getCwd()
      ctx.cwd = cwd
      ctx.env.SENTRY_PROJECT = 'invalid'
      // @ts-ignore
      await publish({ tagsUrl }, ctx)
    } catch (err) {
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('ESENTRYDEPLOY')
    }
  })

  it(SERVER_ERROR_TITLE, async () => {
    try {
      const { cwd } = getCwd()
      ctx.cwd = cwd
      ctx.env.SENTRY_PROJECT = 'server'
      // @ts-ignore
      await publish({ tagsUrl }, ctx)
    } catch (err) {
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('ESENTRYDEPLOY')
    }
  })

  it('Deploy app', async () => {
    ctx.env.SENTRY_PROJECT = 'project'
    const { cwd, sourcemaps } = getCwd()
    ctx.cwd = cwd
    const urlPrefix = '~/dist'
    // @ts-ignore
    const result = await publish({ tagsUrl, sourcemaps, urlPrefix }, ctx)
    expect(result.release.version).to.equal('1.0.0')
  })

  it('Deploy app with releasePrefix', async () => {
    ctx.env.SENTRY_PROJECT = 'project'
    const { cwd, sourcemaps } = getCwd()
    ctx.cwd = cwd
    const urlPrefix = '~/dist'
    const releasePrefix = 'web1'
    // @ts-ignore
    const result = await publish(
      { tagsUrl, sourcemaps, urlPrefix, releasePrefix },
      ctx,
    )
    expect(result.release.version).to.equal(
      `${releasePrefix}-${ctx.nextRelease.version}`,
    )
  })

  it('Deploy app with environment from environment', async () => {
    ctx.env.SENTRY_PROJECT = 'project'
    const { cwd } = getCwd()
    ctx.cwd = cwd
    // @ts-ignore
    const result = await publish({ tagsUrl }, ctx)
    expect(result.deploy.environment).to.equal(ctx.env.SENTRY_ENVIRONMENT)
  })
})
