const https = require('https')
const http = require('http')
const { URL } = require('url')
const { createReadStream } = require('fs')
const FormData = require('form-data')
const getError = require('./get-error')

/**
 * @typedef {import('./types').Context} Context
 * @typedef {import('./types').SentryDeployParams} SentryDeployParams
 * @typedef {import('./types').SentryDeploySuccessResponse} SentryDeploySuccessResponse
 * @typedef {import('./types').SentryReleaseParams} SentryReleaseParams
 * @typedef {import('./types').SentryReleaseSuccessResponse} SentryReleaseSuccessResponse
 * @typedef {import('./types').SentryOrganizationReleaseFile} SentryOrganizationReleaseFile
 * @typedef {import('./types').PATCH_SET_TYPES} PATCH_SET_TYPES
 * @typedef {import('http').RequestOptions} RequestOptions
 */

/**
 * @param {string} path -
 * @param {*} data -
 * @param {string} token -
 * @param {string} url -
 * @param {Context} ctx -
 * @returns {Promise<*>} -
 * @example
 * await request(path, data, token)
 */
const request = (path, data, token, url, ctx) =>
  new Promise((resolve, reject) => {
    const { hostname, protocol } = new URL(url)
    const postData = JSON.stringify(data)
    /** @type {RequestOptions} */
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
      ctx.logger.log('Request', res)
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
 * @param {string} path -
 * @param {{name: string, file: string}} data -
 * @param {string} token -
 * @param {string} url -
 * @param {boolean} rewrite -
 * @param {string} method -
 * @returns {Promise<boolean>} -
 * @example
 * await uploadFile(path, data, token, url)
 */
const uploadFile = (path, data, token, url, rewrite, method = 'POST') =>
  new Promise((resolve, reject) => {
    const { hostname, protocol } = new URL(url)
    const readStream = createReadStream(data.file)
    const form = new FormData()
    form.append('file', readStream)
    form.append('name', data.name)
    /** @type {RequestOptions} */
    const options = {
      hostname,
      path,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders()
      }
    }
    const client = protocol === 'http:' ? http : https
    const req = client.request(options, res => {
      // File already exist or created
      if (res.statusCode === 201) {
        return resolve(true)
      } else if (res.statusCode === 409) {
        if (rewrite) {
          return uploadFile(path, data, token, url, rewrite, 'PUT')
        } else {
          return resolve(true)
        }
      } else {
        return resolve(false)
      }
    })
    req.on('error', () => resolve(false))
    form.pipe(req)
  })

/**
 * @param {SentryReleaseParams} data -
 * @param {string} token -
 * @param {string} org -
 * @param {string} url -
 * @param {Context} ctx -
 * @returns {Promise<SentryReleaseSuccessResponse>} -
 * @example
 * await createRelease(data, token, org, url)
 */
const createRelease = (data, token, org, url, ctx) => {
  return request(`/api/0/organizations/${org}/releases/`, data, token, url, ctx)
}

/**
 * @param {SentryDeployParams} data -
 * @param {string} token -
 * @param {string} org -
 * @param {string} url -
 * @param {string} version -
 * @param {Context} ctx -
 * @returns {Promise<SentryDeploySuccessResponse>} -
 * @example
 * await createDeploy(data, token, org, url, version)
 */
const createDeploy = (data, token, org, url, version, ctx) => {
  return request(
    `/api/0/organizations/${org}/releases/${version}/deploys/`,
    data,
    token,
    url,
    ctx
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
    /** @type {RequestOptions} */
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

/**
 * @param {SentryOrganizationReleaseFile[]} files -
 * @param {boolean} rewrite -
 * @param {string} token -
 * @param {string} org -
 * @param {string} url -
 * @param {string} version -
 * @returns {Promise<void>} -
 * @example
 * await uploadSourceFiles(files, token, org, url, version)
 */
const uploadSourceFiles = async (files, rewrite, token, org, url, version) => {
  for (const file of files) {
    await uploadFile(
      `/api/0/organizations/${org}/releases/${version}/files/`,
      file,
      token,
      url,
      rewrite
    )
  }
}

module.exports = { createRelease, createDeploy, verify, uploadSourceFiles }
