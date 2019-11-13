const https = require('https')

/** @typedef {string} PatchSetType */
/** @enum {PatchSetType} */
// eslint-disable-next-line no-unused-vars
const TYPES = {
  ADD: 'A',
  MODIFY: 'M',
  DELETE: 'D'
}
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
 * @typedef {Object} SentryReleasePatchSet
 * @property {string} path -
 * @property {PatchSetType} type -
 */
/**
 * @typedef {Object} SentryReleaseCommit
 * @property {string} repository -
 * @property {string} message -
 * @property {Array<SentryReleasePatchSet>} [patch_set] -
 * @property {string} author_name -
 * @property {string} [author_email] -
 * @property {string} timestamp -
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
 * @param {SentryReleaseParams} data -
 * @param {string} token -
 * @param {string} org -
 * @returns {Promise<SentryReleaseSuccessResponse>} -
 * @example
 * await createRelease(data, token, org)
 */
const createRelease = (data, token, org) =>
  new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)
    const options = {
      hostname: 'sentry.io',
      path: `/api/0/organizations/${org}/releases/`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }
    const req = https.request(options, res => {
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
 * @param {string} token -
 * @param {string} org -
 * @returns {Promise<*>} -
 * @example
 * await verify(data, token, org)
 */
const verify = (token, org) =>
  new Promise((resolve, reject) => {
    const options = {
      hostname: 'sentry.io',
      path: `/api/0/organizations/${org}/`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
    const req = https.request(options, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Invalid status code: ${res.statusCode}`))
      }
      resolve()
    })
    req.on('error', err => reject(err))
    req.end()
  })

module.exports = { createRelease, verify }
