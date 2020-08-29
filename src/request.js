const https = require('https')
const http = require('http')
const { URL } = require('url')
const getError = require('./get-error')

/** @typedef {string} PatchSetType */
/** @enum {PatchSetType} */
// eslint-disable-next-line no-unused-vars
const TYPES = {
  ADD: 'A',
  MODIFY: 'M',
  DELETE: 'D'
}
/** @typedef {import('./types').Context} Context */
/**
 * @typedef {Object} SentryProject
 * @property {string} name -
 * @property {string} slug -
 */
/**
 * @typedef {Object} SentryReleaseSuccessResponse
 * @property {Array<*>} authors -
 * @property {number} commitCount -
 * @property {*} data -
 * @property {string} dateCreated -
 * @property {string} [dateReleased] -
 * @property {number} deployCount -
 * @property {string} [firstEvent] -
 * @property {string} [lastCommit] -
 * @property {string} [lastDeploy] -
 * @property {string} [lastEvent] -
 * @property {number} newGroups -
 * @property {string} [owner] -
 * @property {Array<SentryProject>} projects -
 * @property {string} ref -
 * @property {string} shortVersion -
 * @property {string} [url] -
 * @property {string} version -
 */
/**
 * @typedef {Object} SentryDeploySuccessResponse
 * @property {string} id -
 * @property {string} name -
 * @property {string} url -
 * @property {string} environment -
 * @property {string} dateStarted -
 * @property {string} dateFinished -
 */
/**
 * @typedef {Object} SentryReleasePatchSet
 * @property {string} path -
 * @property {PatchSetType} type -
 */
/**
 * @typedef {Object} SentryReleaseCommit
 * @property {string} id -
 * @property {string} [repository] -
 * @property {string} [message] -
 * @property {Array<SentryReleasePatchSet>} [patch_set] -
 * @property {string} [author_name] -
 * @property {string} [author_email] -
 * @property {string} [timestamp] -
 */
/**
 * @typedef {Object} SentryReleaseParams
 * @property {string} version -
 * @property {string} [ref] -
 * @property {string} [url] -
 * @property {Array<string>} projects -
 * @property {Date} [dateReleased] -
 * @property {Array<SentryReleaseCommit>} [commits] -
 * @property {Array<string>} [refs] -
 */
/**
 * @typedef {Object} SentryDeployParams
 * @property {string} environment -
 * @property {string} [name] -
 * @property {string} [url] -
 * @property {string} [dateStarted] -
 * @property {string} [dateFinished] -
 */

/**
 * @param {string} path -
 * @param {*} data -
 * @param {string} token -
 * @param {string} url -
 * @returns {Promise<*>} -
 * @example
 * await request(path, data, token)
 */
const request = (path, data, token, url) =>
  new Promise((resolve, reject) => {
    const { hostname, protocol } = new URL(url)
    const postData = JSON.stringify(data)
    const options = {
      hostname,
      path,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    const client = protocol === 'http:' ? http : https
    const req = client.request(options, res => {
      if (res.statusCode !== 201) {
        return reject(new Error(`Invalid status code: ${res.statusCode}`))
      }
      /** @type {Array<Buffer>} */
      const chunks = []
      let totalLength = 0
      res.on('data', (/** @type {Buffer} */ chunk) => {
        chunks.push(chunk)
        totalLength += chunk.length
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks, totalLength).toString()))
        } catch (err) {
          reject(err)
        }
      })
    })
    req.on('error', err => reject(err))
    req.write(postData)
    req.end()
  })

/**
 * @param {SentryReleaseParams} data -
 * @param {string} token -
 * @param {string} org -
 * @param {string} url -
 * @returns {Promise<SentryReleaseSuccessResponse>} -
 * @example
 * await createRelease(data, token, org, url)
 */
const createRelease = (data, token, org, url) => {
  return request(`/api/0/organizations/${org}/releases/`, data, token, url)
}

/**
 * @param {SentryDeployParams} data -
 * @param {string} token -
 * @param {string} org -
 * @param {string} url -
 * @param {string} version -
 * @returns {Promise<SentryDeploySuccessResponse>} -
 * @example
 * await createDeploy(data, token, org, url, version)
 */
const createDeploy = (data, token, org, url, version) => {
  return request(
    `/api/0/organizations/${org}/releases/${version}/deploys/`,
    data,
    token,
    url
  )
}

/**
 * @param {string} token -
 * @param {string} org -
 * @param {string} url -
 * @param {Context} ctx -
 * @returns {Promise<*>} -
 * @example
 * await verify(token, org, url)
 */
const verify = (token, org, url, ctx) =>
  new Promise((resolve, reject) => {
    const { hostname, protocol } = new URL(url)
    const options = {
      hostname,
      path: `/api/0/organizations/${org}/releases/`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
    const client = protocol === 'http:' ? http : https
    const req = client.request(options, res => {
      /** @type {Array<Buffer>} */
      const chunks = []
      let totalLength = 0
      res.on('data', (/** @type {Buffer} */ chunk) => {
        chunks.push(chunk)
        totalLength += chunk.length
      })
      res.on('end', () => {
        try {
          const raw = Buffer.concat(chunks, totalLength).toString()
          const body = JSON.parse(raw || '{}')
          ctx.message = body.detail
          if (res.statusCode === 200) {
            resolve()
          } else if (res.statusCode === 401) {
            reject(getError('EINVALIDSENTRYTOKEN', ctx))
          } else if (res.statusCode === 403) {
            reject(getError('EPERMISSIONSSENTRYTOKEN', ctx))
          } else if (res.statusCode === 404) {
            reject(getError('EINVALIDSENTRYORG', ctx))
          } else {
            reject(new Error(`Invalid status code: ${res.statusCode}`))
          }
        } catch (err) {
          reject(err)
        }
      })
    })
    req.on('error', err => reject(err))
    req.end()
  })

module.exports = { createRelease, createDeploy, verify }
