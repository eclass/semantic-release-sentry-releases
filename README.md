# semantic-release-sentry-releases

[![npm](https://img.shields.io/npm/v/semantic-release-sentry-releases.svg)](https://www.npmjs.com/package/semantic-release-sentry-releases)
![Node.js CI](https://github.com/spikeelabs/semantic-release-sentry-releases/workflows/Node.js%20CI/badge.svg)
[![downloads](https://img.shields.io/npm/dt/semantic-release-sentry-releases.svg)](https://www.npmjs.com/package/semantic-release-sentry-releases)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/semantic-release-sentry-releases)
[![Coverage Status](https://coveralls.io/repos/github/spikeelabs/semantic-release-sentry-releases/badge.svg?branch=master)](https://coveralls.io/github/spikeelabs/semantic-release-sentry-releases?branch=master)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> [semantic-release](https://github.com/semantic-release/semantic-release) plugin to create releases in [sentry](https://docs.sentry.io/workflow/releases/?platform=browsernpm#create-release)

| Step               | Description                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `verifyConditions` | Verify the presence of the `SENTRY_AUTH_TOKEN` `SENTRY_ORG` and `SENTRY_PROJECT` environment variable. |
| `publish`          | Create release and deploy in sentry project.                                                           |

## Install

```bash
npm i -D semantic-release-sentry-releases
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
    "semantic-release-sentry-releases"
  ]
}
```

## Configuration

### Environment variables

| Variable             | Description                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SENTRY_AUTH_TOKEN`  | The authentication token with permission for releases created in [profile](https://docs.sentry.io/api/auth/#id1) or as [internal integration](https://docs.sentry.io/product/integrations/integration-platform/#internal-integrations) in developer settings of organization. Need scopes `release:admin`. Optional `org:read` to get valid repository name from sentry integration |
| `SENTRY_ORG`         | The slug of the organization.                                                                                                                                                                                                                                                                                                                                                       |
| `SENTRY_PROJECT`     | The slug of the project.                                                                                                                                                                                                                                                                                                                                                            |
| `SENTRY_URL`         | The URL to use to connect to sentry. This defaults to https://sentry.io/.                                                                                                                                                                                                                                                                                                           |
| `SENTRY_ENVIRONMENT` | The environment to specify with this release. This defaults to production.                                                                                                                                                                                                                                                                                                          |
| `DEPLOY_START`       | Sentry deploy start timestamp. Optional for deploy                                                                                                                                                                                                                                                                                                                                  |
| `DEPLOY_END`         | Sentry deploy end timestamp. Optional for deploy                                                                                                                                                                                                                                                                                                                                    |

### Options

| Variable        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project`       | The slug of the project. Optional. Required if not present in environment variables                                                                                                                                                                                                                                                                                                                                                                        |
| `org`           | The slug of the organization. Optional. Required if not present in environment variables                                                                                                                                                                                                                                                                                                                                                                   |
| `url`           | The URL to use to connect to sentry. Optional to set an on-premise instance                                                                                                                                                                                                                                                                                                                                                                                |
| `repositoryUrl` | A valid repository name for add link to commits of new release in **sentry format**. Optional. Ex: 'myorg / myapp'. Default repository property in package.json, or git origin url. Try recovery repository name from sentry api https://docs.sentry.io/api/organizations/list-an-organizations-repositories/                                                                                                                                              |
| `tagsUrl`       | A valid url for add link to new release. Optional. Ex: https://github.com/owner/repo/releases/tag/vx.y.z                                                                                                                                                                                                                                                                                                                                                   |
| `environment`   | Sentry environment. Optional for deploy. Default production                                                                                                                                                                                                                                                                                                                                                                                                |
| `deployName`    | Deploy name. Optional for deploy                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `deployUrl`     | Deploy url. Optional for deploy                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `sourcemaps`    | Directory with sourcemaps. Example `dist`. Optional for upload sourcemaps                                                                                                                                                                                                                                                                                                                                                                                  |
| `urlPrefix`     | URL prefix for sourcemaps. Example `~/dist`. Optional for upload sourcemaps                                                                                                                                                                                                                                                                                                                                                                                |
| `rewrite`       | Boolean to indicate rewrite sourcemaps. Default `false`. Optional for upload sourcemaps                                                                                                                                                                                                                                                                                                                                                                    |
| `releasePrefix` | String that is passed as prefix to the sentry release. <br/> Optional to fix the problem that releases are associated with the organization instead of the project ([Read More](https://github.com/getsentry/sentry-cli/issues/482)). <br/> Ex: `releasePrefix:"web1"` would resolve **only** the sentry release to `web1-1.0.0`. <br/>**Important Notice:** when you use this feature you also have to change the release name in your sentry client app. |

| `pathToGitFolder` | Path to `.git` folder, relative to the current working directory. Optional. Defaults to current working directory |

### Examples

```json
{
  "plugins": [
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/gitlab",
    [
      "semantic-release-sentry-releases",
      {
        "repositoryUrl": "myorg / myapp",
        "tagsUrl": "https://github.com/owner/repo/releases/tag/"
      }
    ]
  ]
}
```

#### Upload sourcemaps

```json
{
  "plugins": [
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
    "@semantic-release/gitlab",
    [
      "@semantic-release/exec",
      {
        "prepareCmd": "npm run build"
      }
    ],
    [
      "semantic-release-sentry-releases",
      {
        "repositoryUrl": "myorg / myapp",
        "tagsUrl": "https://github.com/owner/repo/releases/tag/",
        "sourcemaps": "dist",
        "urlPrefix": "~/dist"
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
  - '18'
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
