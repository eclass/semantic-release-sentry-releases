const { describe, it, before } = require('mocha')
const { expect } = require('chai')
const tempy = require('tempy')
const verify = require('../src/verify')

describe('Verify', () => {
  let cwd

  before(() => {
    cwd = tempy.directory()
  })

  it('Return SemanticReleaseError if a custom environment variable is not defined', async () => {
    try {
      await verify({}, { cwd, env: {} })
    } catch (err) {
      expect(err.name).to.equal('SemanticReleaseError')
      expect(err.code).to.equal('CUSTOMERROR')
    }
  })

  it('Verify alias from a custom environmen variable', async () => {
    const env = { CUSTOM_ENV: 'custom' }
    expect(await verify({}, { cwd, env })).to.be.a('undefined')
  })
})
