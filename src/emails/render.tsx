import { render } from '@react-email/render'
import { MagicLinkEmail } from './MagicLink'
import { WelcomeEmail } from './Welcome'
import { SignInEmail } from './SignIn'
import type { NewsletterPluginConfig } from '../types'

export type EmailTemplate = 'magic-link' | 'welcome' | 'signin'

export interface BaseEmailData {
  email?: string
  siteName?: string
  [key: string]: any
}

export interface MagicLinkData extends BaseEmailData {
  magicLink?: string
  verificationUrl?: string
  magicLinkUrl?: string
  expiresIn?: string
}

export interface WelcomeData extends BaseEmailData {
  preferencesUrl?: string
}

export async function renderEmail(
  template: EmailTemplate, 
  data: MagicLinkData | WelcomeData,
  config?: NewsletterPluginConfig
): Promise<string> {
  try {
    // Check for custom templates if config provided
    if (config?.customTemplates) {
      const customTemplate = config.customTemplates[template]
      if (customTemplate) {
        const CustomComponent = customTemplate
        return render(<CustomComponent {...data} />)
      }
    }
    
    // Fall back to built-in templates
    switch (template) {
      case 'magic-link': {
        const magicLinkData = data as MagicLinkData
        return render(
          <MagicLinkEmail
            magicLink={
              magicLinkData.magicLink || 
              magicLinkData.verificationUrl || 
              magicLinkData.magicLinkUrl || 
              ''
            }
            email={magicLinkData.email || ''}
            siteName={magicLinkData.siteName}
            expiresIn={magicLinkData.expiresIn}
          />
        )
      }
      
      case 'signin': {
        const signinData = data as MagicLinkData
        return render(
          <SignInEmail
            magicLink={
              signinData.magicLink || 
              signinData.verificationUrl || 
              signinData.magicLinkUrl || 
              ''
            }
            email={signinData.email || ''}
            siteName={signinData.siteName}
            expiresIn={signinData.expiresIn}
          />
        )
      }
      
      case 'welcome': {
        const welcomeData = data as WelcomeData
        return render(
          <WelcomeEmail
            email={welcomeData.email || ''}
            siteName={welcomeData.siteName}
            preferencesUrl={welcomeData.preferencesUrl}
          />
        )
      }
      
      default:
        throw new Error(`Unknown email template: ${template}`)
    }
  } catch (error) {
    console.error(`Failed to render email template ${template}:`, error)
    throw error
  }
}

// Export for custom template rendering
export { MagicLinkEmail, WelcomeEmail, SignInEmail }