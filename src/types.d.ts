import {
  Config as SemanticReleaseConfig,
  Context as SemanticReleaseContext,
  Result as SemanticReleaseResult,
  Commit
} from 'semantic-release'

export interface Context extends SemanticReleaseContext, SemanticReleaseConfig, SemanticReleaseResult {
  commits?: Commit[],
  message?: string
}

export interface Config {
  // Set url of repository tags. Ex: https://gitlab.com/my-org/my-repo
  repositoryUrl?: string
  // Set url of repository tags. Ex: https://gitlab.com/my-org/my-repo/-/tags
  tagsUrl?: string
  environment?: string
  deployName?: string
  deployUrl?: string
  org?: string
  url?: string
  project?: string
  sourcemaps?: string
  urlPrefix?: string
  rewrite?: boolean
}

export enum PATCH_SET_TYPES {
  ADD = 'A',
  MODIFY = 'M',
  DELETE = 'D'
}
export interface SentryProject {
  name: string
  slug: string
}

export interface SentryReleaseSuccessResponse {
  authors: any[]
  commitCount: number
  data: any
  dateCreated: string
  dateReleased?: string
  deployCount: number
  firstEvent?: string
  lastCommit?: string
  lastDeploy?: string
  lastEvent?: string
  newGroups: number
  owner?: string
  projects: SentryProject[]
  ref: string
  shortVersion: string
  url?: string
  version: string
}

export interface SentryDeploySuccessResponse {
  dateFinished: string
  dateStarted: string
  environment: string
  id: string
  name: string
  url: string
}

export interface SentryReleasePatchSet {
  path: string
  type: PATCH_SET_TYPES
}

export interface SentryReleaseCommit {
  author_email?: string
  author_name?: string
  id: string
  message?: string
  patch_set?: SentryReleasePatchSet[]
  repository?: string
  timestamp?: string
}

export interface SentryReleaseParams {
  commits?: SentryReleaseCommit[]
  dateReleased?: Date
  projects: string[]
  ref?: string
  refs?: string[]
  url?: string
  version: string
}

export interface SentryDeployParams {
  dateFinished?: string
  dateStarted?: string
  environment: string
  name?: string
  url?: string
}

export interface PublishResult {
  release: SentryReleaseSuccessResponse
  deploy: SentryDeploySuccessResponse
}

export interface GitDiffTreeData {
  toFile: string
  status: PATCH_SET_TYPES
}
