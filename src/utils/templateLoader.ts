import React from 'react'
import { DefaultBroadcastTemplate } from '../email-templates/DefaultBroadcastTemplate'

class TemplateLoader {
  private defaultTemplate: React.ComponentType<any>
  private customTemplate?: React.ComponentType<any>
  private loadAttempted = false
  
  constructor() {
    this.defaultTemplate = DefaultBroadcastTemplate
  }
  
  async loadTemplate(): Promise<React.ComponentType<any>> {
    // Try to load custom template only once
    if (!this.loadAttempted) {
      this.loadAttempted = true
      await this.attemptCustomTemplateLoad()
    }
    
    return this.customTemplate || this.defaultTemplate
  }
  
  private async attemptCustomTemplateLoad(): Promise<void> {
    try {
      // Try to load from conventional location
      // This will be resolved at build time by the user's bundler
      const customTemplatePath = `${process.cwd()}/email-templates/broadcast-template`
      
      // Dynamic import with fallback
      const module = await import(
        /* @vite-ignore */
        /* webpackIgnore: true */
        customTemplatePath
      ).catch(() => null)
      
      if (module) {
        this.customTemplate = module.default || module.BroadcastTemplate
      }
    } catch {
      // Custom template not found, use default
      // Silent fallback to default template
    }
  }
  
  // Reset for testing
  reset(): void {
    this.customTemplate = undefined
    this.loadAttempted = false
  }
}

// Export singleton instance
const templateLoader = new TemplateLoader()

export async function loadTemplate(): Promise<React.ComponentType<any>> {
  return templateLoader.loadTemplate()
}

// Export for testing
export { TemplateLoader }