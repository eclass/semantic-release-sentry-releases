import SemanticRelease from 'semantic-release'

export interface Context extends SemanticRelease.Context {
  commits?: SemanticRelease.Commit[]
}

export interface Config extends SemanticRelease.Config {
  // Set url of repo tags. Ex: https://gitlab.com/my-org/my-repo/-/tags
  tagsUrl?: string
}
