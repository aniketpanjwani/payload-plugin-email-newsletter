import React from 'react'
import {
  Heading,
  Text,
  Button,
  Section,
} from '@react-email/components'
import { BaseTemplate } from './BaseTemplate'
import type { MagicLinkEmailProps } from '../types'

const magicLinkStyles = {
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 16px 0',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#4a4a4a',
    margin: '0 0 16px 0',
  },
  button: {
    backgroundColor: '#0066cc',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    width: '100%',
    padding: '16px 24px',
    margin: '32px 0',
  },
  codeSection: {
    backgroundColor: '#f6f8fa',
    borderRadius: '6px',
    padding: '24px',
    margin: '24px 0',
    textAlign: 'center' as const,
  },
  code: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: '2px',
    fontFamily: 'monospace',
  },
  warning: {
    fontSize: '14px',
    color: '#dc3545',
    margin: '16px 0',
    padding: '12px',
    backgroundColor: '#f8d7da',
    borderRadius: '4px',
  },
  expire: {
    fontSize: '14px',
    color: '#6c757d',
    fontStyle: 'italic',
  },
}

export const MagicLinkTemplate: React.FC<MagicLinkEmailProps> = ({
  magicLinkUrl,
  subscriber,
}) => {
  // Extract a verification code from the URL for fallback
  const urlParams = new URL(magicLinkUrl).searchParams
  const token = urlParams.get('token')
  const verificationCode = token ? token.slice(-6).toUpperCase() : 'XXXXXX'

  return (
    <BaseTemplate
      preview="Sign in to manage your newsletter preferences"
    >
      <Heading style={magicLinkStyles.heading}>
        Sign in to your account
      </Heading>
      
      <Text style={magicLinkStyles.text}>
        Hi{subscriber.name ? ` ${subscriber.name}` : ''},
      </Text>
      
      <Text style={magicLinkStyles.text}>
        You requested a sign-in link for your newsletter account. Click the button below to access your preferences:
      </Text>
      
      <Button
        href={magicLinkUrl}
        style={magicLinkStyles.button}
      >
        Sign In to Your Account
      </Button>
      
      <Section style={magicLinkStyles.codeSection}>
        <Text style={{ ...magicLinkStyles.text, margin: '0 0 8px 0' }}>
          Or use this verification code:
        </Text>
        <Text style={magicLinkStyles.code}>
          {verificationCode}
        </Text>
      </Section>
      
      <Text style={magicLinkStyles.warning}>
        If you didn't request this email, you can safely ignore it.
      </Text>
      
      <Text style={magicLinkStyles.expire}>
        This link will expire in 7 days for your security.
      </Text>
    </BaseTemplate>
  )
}

// Export a function that creates a custom magic link template
export function createMagicLinkTemplate(
  customContent?: {
    heading?: string
    intro?: string
    buttonText?: string
    warning?: string
    expireText?: string
    includeCode?: boolean
  },
  customStyles?: Partial<typeof magicLinkStyles>
): React.FC<MagicLinkEmailProps> {
  const mergedStyles = {
    ...magicLinkStyles,
    ...customStyles,
  }
  
  return (props: MagicLinkEmailProps) => {
    const urlParams = new URL(props.magicLinkUrl).searchParams
    const token = urlParams.get('token')
    const verificationCode = token ? token.slice(-6).toUpperCase() : 'XXXXXX'
    
    return (
      <BaseTemplate
        preview={customContent?.heading || "Sign in to manage your newsletter preferences"}
      >
        <Heading style={mergedStyles.heading}>
          {customContent?.heading || 'Sign in to your account'}
        </Heading>
        
        <Text style={mergedStyles.text}>
          Hi{props.subscriber.name ? ` ${props.subscriber.name}` : ''},
        </Text>
        
        <Text style={mergedStyles.text}>
          {customContent?.intro || 'You requested a sign-in link for your newsletter account. Click the button below to access your preferences:'}
        </Text>
        
        <Button
          href={props.magicLinkUrl}
          style={mergedStyles.button}
        >
          {customContent?.buttonText || 'Sign In to Your Account'}
        </Button>
        
        {customContent?.includeCode !== false && (
          <Section style={mergedStyles.codeSection}>
            <Text style={{ ...mergedStyles.text, margin: '0 0 8px 0' }}>
              Or use this verification code:
            </Text>
            <Text style={mergedStyles.code}>
              {verificationCode}
            </Text>
          </Section>
        )}
        
        <Text style={mergedStyles.warning}>
          {customContent?.warning || "If you didn't request this email, you can safely ignore it."}
        </Text>
        
        <Text style={mergedStyles.expire}>
          {customContent?.expireText || 'This link will expire in 7 days for your security.'}
        </Text>
      </BaseTemplate>
    )
  }
}