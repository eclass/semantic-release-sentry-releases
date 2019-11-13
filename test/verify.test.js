const { describe, it, beforeEach } = require('mocha')
const { expect } = require('chai')
const nock = require('nock')
const verify = require('../src/verify')

describe('Verify', () => {
  const env = { SENTRY_ORG: 'invalid', SENTRY_PROJECT: 'project' }
  const SENTRY_HOST = 'https://sentry.io'
  const NOCK_OPTIONS = { reqheaders: { authorization: 'Bearer valid' } }

  beforeEach(() => {
    nock.disableNetConnect()
    nock(SENTRY_HOST)
      .get('/api/0/organizations/invalid/')
      .reply(404)
    nock(SENTRY_HOST, {
      reqheaders: {
        authorization: 'Bearer invalid'
      }
    })
      .get('/api/0/organizations/valid/')
      .reply(401)
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .get('/api/0/organizations/valid/')
      .reply(200)
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .post('/api/0/organizations/valid/releases/')
      .reply(201)
    nock(SENTRY_HOST, NOCK_OPTIONS)
      .get('/api/0/organizations/error/')
      .replyWithError('server error')
  })

  it('Return SemanticReleaseError if a SENTRY_TOKEN environment variable is not defined', async () => {
    try {
      // @ts-ignore
      await verify({}, { env })
    } catch (errs) {
      const err = errs._errors[0]
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('ENOSENTRYTOKEN')
    }
  })

  it('Return SemanticReleaseError if a SENTRY_ORG environment variable is not defined', async () => {
    try {
      env.SENTRY_TOKEN = 'invalid'
      delete env.SENTRY_ORG
      // @ts-ignore
      await verify({}, { env })
    } catch (errs) {
      const err = errs._errors[0]
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('ENOSENTRYORG')
    }
  })

  it('Return SemanticReleaseError if a SENTRY_PROJECT environment variable is not defined', async () => {
    try {
      env.SENTRY_TOKEN = 'invalid'
      env.SENTRY_ORG = 'invalid'
      delete env.SENTRY_PROJECT
      // @ts-ignore
      await verify({}, { env })
    } catch (errs) {
      const err = errs._errors[0]
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('ENOSENTRYPROJECT')
    }
  })

  it('Return SemanticReleaseError if a tagsUrl is invalid', async () => {
    try {
      env.SENTRY_TOKEN = 'invalid'
      env.SENTRY_ORG = 'invalid'
      env.SENTRY_PROJECT = 'project'
      // @ts-ignore
      await verify({ tagsUrl: '1111' }, { env })
    } catch (errs) {
      const err = errs._errors[0]
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('EINVALIDTAGSURL')
    }
  })

  it('Return SemanticReleaseError if a get a error from sentry', async () => {
    try {
      env.SENTRY_TOKEN = 'valid'
      env.SENTRY_ORG = 'error'
      env.SENTRY_PROJECT = 'project'
      // @ts-ignore
      await verify({}, { env })
    } catch (err) {
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('ESENTRYDEPLOY')
    }
  })

  it('Return SemanticReleaseError if a SENTRY_ORG environment variable is invalid', async () => {
    try {
      env.SENTRY_TOKEN = 'valid'
      env.SENTRY_ORG = 'invalid'
      env.SENTRY_PROJECT = 'project'
      // @ts-ignore
      await verify({}, { env })
    } catch (err) {
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('EINVALIDSENTRYORG')
    }
  })

  it('Return SemanticReleaseError if a SENTRY_TOKEN environment variable is invalid', async () => {
    try {
      env.SENTRY_TOKEN = 'invalid'
      env.SENTRY_ORG = 'valid'
      env.SENTRY_PROJECT = 'project'
      // @ts-ignore
      await verify({}, { env })
    } catch (err) {
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('EINVALIDSENTRYTOKEN')
    }
  })

  it('Verify alias from a custom environmen variable', async () => {
    env.SENTRY_TOKEN = 'valid'
    env.SENTRY_ORG = 'valid'
    env.SENTRY_PROJECT = 'project'
    // @ts-ignore
    expect(await verify({}, { env })).to.be.a('undefined')
  })
})
