const https = require('https')
const http = require('http')
const { URL } = require('url')
const getError = require('./get-error')

/**
 * @typedef {import('./types').Context} Context
 * @typedef {import('./types').SentryDeployParams} SentryDeployParams
 * @typedef {import('./types').SentryDeploySuccessResponse} SentryDeploySuccessResponse
 * @typedef {import('./types').SentryReleaseParams} SentryReleaseParams
 * @typedef {import('./types').SentryReleaseSuccessResponse} SentryReleaseSuccessResponse
 * @typedef {import('./types').PATCH_SET_TYPES} PATCH_SET_TYPES
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
