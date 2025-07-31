// Server-safe context for plugin configuration
// NO React context, just a simple object store

import type { NewsletterPluginConfig } from '../types'

export interface PluginConfigStore {
  config: NewsletterPluginConfig | null
}

const configStore: PluginConfigStore = {
  config: null,
}

export const setPluginConfig = (config: NewsletterPluginConfig) => {
  configStore.config = config
}

export const getPluginConfig = (): NewsletterPluginConfig | null => {
  return configStore.config
}