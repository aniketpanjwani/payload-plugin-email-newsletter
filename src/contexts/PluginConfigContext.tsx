'use client'

import React, { createContext, useContext } from 'react'
import type { NewsletterPluginConfig } from '../types'

const PluginConfigContext = createContext<NewsletterPluginConfig | null>(null)

export const PluginConfigProvider: React.FC<{
  config: NewsletterPluginConfig
  children: React.ReactNode
}> = ({ config, children }) => {
  return (
    <PluginConfigContext.Provider value={config}>
      {children}
    </PluginConfigContext.Provider>
  )
}

export const usePluginConfig = () => {
  const config = useContext(PluginConfigContext)
  if (!config) {
    throw new Error('usePluginConfig must be used within PluginConfigProvider')
  }
  return config
}

/**
 * Hook to safely access plugin config without throwing if context is not available
 * This is useful for components that might be used outside of the plugin context
 */
export const usePluginConfigOptional = () => {
  return useContext(PluginConfigContext)
}