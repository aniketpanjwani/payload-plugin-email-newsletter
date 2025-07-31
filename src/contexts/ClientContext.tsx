'use client'

import React, { createContext, useContext } from 'react'
import type { NewsletterPluginConfig } from '../types'

// Client-side React context (safe to use createContext here)
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
  const context = useContext(PluginConfigContext)
  if (!context) {
    throw new Error('usePluginConfig must be used within a PluginConfigProvider')
  }
  return context
}

export const usePluginConfigOptional = () => {
  return useContext(PluginConfigContext)
}