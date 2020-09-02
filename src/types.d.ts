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
  usePackageRepositoryUrl?: boolean
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
