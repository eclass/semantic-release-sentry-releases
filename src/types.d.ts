import { Context as SemanticReleaseContext } from 'semantic-release'
import { Config as SemanticReleaseConfig } from 'semantic-release'

export interface Context extends SemanticReleaseContext {
  commits?: SemanticRelease.Commit[]
}

export interface Config extends SemanticReleaseConfig {
  // Set url of repository tags. Ex: https://gitlab.com/my-org/my-repo
  repositoryUrl?: string
  // Set url of repository tags. Ex: https://gitlab.com/my-org/my-repo/-/tags
  tagsUrl?: string
  environment?: string
  deployName?: string
  deployUrl?: string
  org?: string
  project?: string
}
