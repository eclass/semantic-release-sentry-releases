# @eclass/semantic-release-sentry-releases

[![npm](https://img.shields.io/npm/v/@eclass/semantic-release-sentry-releases.svg)](https://www.npmjs.com/package/@eclass/semantic-release-sentry-releases)
![Node.js CI](https://github.com/eclass/semantic-release-sentry-releases/workflows/Node.js%20CI/badge.svg)
[![downloads](https://img.shields.io/npm/dt/@eclass/semantic-release-sentry-releases.svg)](https://www.npmjs.com/package/@eclass/semantic-release-sentry-releases)
[![dependencies](https://img.shields.io/david/eclass/semantic-release-sentry-releases.svg)](https://david-dm.org/eclass/semantic-release-sentry-releases)
[![devDependency Status](https://img.shields.io/david/dev/eclass/semantic-release-sentry-releases.svg)](https://david-dm.org/eclass/semantic-release-sentry-releases#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/github/eclass/semantic-release-sentry-releases/badge.svg?branch=master)](https://coveralls.io/github/eclass/semantic-release-sentry-releases?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/f84f0bcb39c9a5c5fb99/maintainability)](https://codeclimate.com/github/eclass/semantic-release-sentry-releases/maintainability)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> [semantic-release](https://github.com/semantic-release/semantic-release) plugin to create releases in [sentry](https://docs.sentry.io/workflow/releases/?platform=browsernpm#create-release)

| Step               | Description                                                                                 |
|--------------------|---------------------------------------------------------------------------------------------|
| `verifyConditions` | Verify the presence of the `SENTRY_AUTH_TOKEN` `SENTRY_ORG` and `SENTRY_PROJECT` environment variable. |
| `publish`          | Create release and deploy in sentry project.                                                                   |

## Install

```bash
npm i -D @eclass/semantic-release-sentry-releases
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/caribou/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/gitlab",
    "@eclass/semantic-release-sentry-releases"
  ]
}
```

## Configuration

### Environment variables

| Variable             | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `SENTRY_AUTH_TOKEN` | Sentry token created in [profile](https://docs.sentry.io/api/auth/#id1) |
| `SENTRY_ORG` | Sentry organization name |
| `SENTRY_PROJECT` | Sentry project name |
| `DEPLOY_START` | Sentry deploy start timestamp. Optional for deploy |
| `DEPLOY_END` | Sentry deploy end timestamp. Optional for deploy |

### Options

| Variable  | Description                                                       |
| --------- | ----------------------------------------------------------------- |
| `project` | Sentry project name. Optional. Required if not present in environment variables |
| `org` | Sentry organization name. Optional. Required if not present in environment variables |
| `repositoryUrl` | A valid url for add link to commits of new release. Optional. Ex: https://github.com/owner/repo |
| `tagsUrl` | A valid url for add link to new release. Optional. Ex: https://github.com/owner/repo/releases/tag/vx.y.z |
| `environment` | Sentry environment. Optional for deploy. Default production |
| `deployName` | Deploy name. Optional for deploy |
| `deployUrl` | Deploy url. Optional for deploy |

### Examples

```json
{
  "plugins": [
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/gitlab",
    [
      "@eclass/semantic-release-sentry-releases",
      {
        "repositoryUrl": "https://github.com/owner/repo",
        "tagsUrl": "https://github.com/owner/repo/releases/tag/"
      }
    ]
  ]
}
```

```yml
# .gitlab-ci.yml
release:
  image: node:alpine
  stage: release
  script:
    - npx semantic-release
  only:
    - master
```

```yml
# .travis.yml
language: node_js
cache:
  directories:
    - ~/.npm
node_js:
  - "12"
stages:
  - test
  - name: deploy
    if: branch = master
jobs:
  include:
    - stage: test
      script: npm t
    - stage: deploy
      script: npx semantic-release

```

## License

[MIT](https://tldrlegal.com/license/mit-license)
