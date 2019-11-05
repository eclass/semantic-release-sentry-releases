const tempy = require('tempy')
const { stub } = require('sinon')
const { describe, it, before, beforeEach } = require('mocha')
const { expect } = require('chai')
const { WritableStreamBuffer } = require('stream-buffers')

describe('Publish', () => {
  let stdout
  let stderr
  let cwd
  let logger
  let publish

  before(() => {
    logger = { log: stub() }
    cwd = tempy.directory()
    publish = require('../src/publish')
  })

  beforeEach(() => {
    stdout = new WritableStreamBuffer()
    stderr = new WritableStreamBuffer()
  })

  it('Deploy app', async () => {
    expect(await publish({}, { cwd, stdout, stderr, logger })).to.be.a(
      'undefined'
    )
  })
})
