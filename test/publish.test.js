const { describe, it, beforeEach } = require('mocha')
const { expect } = require('chai')
const nock = require('nock')
const publish = require('../src/publish')

describe('Publish', () => {
  const ctx = {
    env: {
      SENTRY_ORG: 'valid',
      SENTRY_PROJECT: 'error',
      SENTRY_TOKEN: 'valid'
    },
    commits: [
      {
        hash: 'bb3dedcb1fbbd8ffa8fc75d082ea91340a4c7aa7',
        message: 'fix(js): fix request',
        author: { name: 'me', email: 'me@me.me' },
        committerDate: new Date().toISOString()
      }
    ],
    nextRelease: { version: '1.0.0', gitTag: 'v1.0.0' }
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
      .post(PATH_RELEASE, body => body.projects.includes('error'))
      .reply(500)
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .post(PATH_RELEASE, body => body.projects.includes('server'))
      .replyWithError('server error')
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .post(PATH_RELEASE, body => body.projects.includes('invalid'))
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
            slug: 'project'
          }
        ],
        ref: '6ba09a7c53235ee8a8fa5ee4c1ca8ca886e7fdbb',
        shortVersion: '1.0.0',
        url: null,
        version: '1.0.0'
      })
  })

  it(SERVER_ERROR_TITLE, async () => {
    try {
      // @ts-ignore
      await publish({ tagsUrl: '' }, ctx)
    } catch (err) {
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('ESENTRYDEPLOY')
    }
  })

  it(SERVER_ERROR_TITLE, async () => {
    try {
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
    // @ts-ignore
    const result = await publish({ tagsUrl }, ctx)
    expect(result.version).to.equal('1.0.0')
  })
})
