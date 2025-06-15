import React from 'react'
import {
  Heading,
  Text,
  Link,
  Button,
} from '@react-email/components'
import { BaseTemplate } from './BaseTemplate'
import type { WelcomeEmailProps } from '../types'

const welcomeStyles = {
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 16px 0',
  },
  subheading: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#4a4a4a',
    margin: '24px 0 12px 0',
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
    width: '200px',
    padding: '12px 20px',
    margin: '24px 0',
  },
  list: {
    paddingLeft: '20px',
    margin: '0 0 16px 0',
  },
  listItem: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#4a4a4a',
    marginBottom: '8px',
  },
}

export const WelcomeTemplate: React.FC<WelcomeEmailProps> = ({
  subscriber,
  unsubscribeUrl,
  preferencesUrl,
}) => {
  return (
    <BaseTemplate
      preview={`Welcome to our newsletter, ${subscriber.name || 'there'}!`}
      footer={{
        unsubscribeUrl,
        preferencesUrl,
      }}
    >
      <Heading style={welcomeStyles.heading}>
        Welcome{subscriber.name ? `, ${subscriber.name}` : ''}!
      </Heading>
      
      <Text style={welcomeStyles.text}>
        Thank you for subscribing to our newsletter. We're excited to have you on board!
      </Text>
      
      <Text style={welcomeStyles.text}>
        Here's what you can expect from us:
      </Text>
      
      <ul style={welcomeStyles.list}>
        <li style={welcomeStyles.listItem}>
          Weekly updates with our latest content
        </li>
        <li style={welcomeStyles.listItem}>
          Exclusive insights and tips
        </li>
        <li style={welcomeStyles.listItem}>
          Early access to new features and announcements
        </li>
      </ul>
      
      {preferencesUrl && (
        <>
          <Heading as="h2" style={welcomeStyles.subheading}>
            Customize Your Experience
          </Heading>
          
          <Text style={welcomeStyles.text}>
            Want to control what types of emails you receive? Visit your preferences page to customize your subscription.
          </Text>
          
          <Button
            href={preferencesUrl}
            style={welcomeStyles.button}
          >
            Manage Preferences
          </Button>
        </>
      )}
      
      <Text style={welcomeStyles.text}>
        If you have any questions or feedback, feel free to reply to this email. We'd love to hear from you!
      </Text>
      
      <Text style={welcomeStyles.text}>
        Best regards,<br />
        The Team
      </Text>
    </BaseTemplate>
  )
}

// Export a function that creates a custom welcome template
export function createWelcomeTemplate(
  customContent?: {
    heading?: string
    intro?: string
    features?: string[]
    ctaText?: string
    closing?: string
  },
  customStyles?: Partial<typeof welcomeStyles>
): React.FC<WelcomeEmailProps> {
  const mergedStyles = {
    ...welcomeStyles,
    ...customStyles,
  }
  
  return (props: WelcomeEmailProps) => (
    <BaseTemplate
      preview={customContent?.heading || `Welcome to our newsletter, ${props.subscriber.name || 'there'}!`}
      footer={{
        unsubscribeUrl: props.unsubscribeUrl,
        preferencesUrl: props.preferencesUrl,
      }}
    >
      <Heading style={mergedStyles.heading}>
        {customContent?.heading || `Welcome${props.subscriber.name ? `, ${props.subscriber.name}` : ''}!`}
      </Heading>
      
      <Text style={mergedStyles.text}>
        {customContent?.intro || 'Thank you for subscribing to our newsletter. We\'re excited to have you on board!'}
      </Text>
      
      {customContent?.features && customContent.features.length > 0 && (
        <>
          <Text style={mergedStyles.text}>
            Here's what you can expect from us:
          </Text>
          
          <ul style={mergedStyles.list}>
            {customContent.features.map((feature, index) => (
              <li key={index} style={mergedStyles.listItem}>
                {feature}
              </li>
            ))}
          </ul>
        </>
      )}
      
      {props.preferencesUrl && (
        <>
          <Heading as="h2" style={mergedStyles.subheading}>
            Customize Your Experience
          </Heading>
          
          <Text style={mergedStyles.text}>
            Want to control what types of emails you receive? Visit your preferences page to customize your subscription.
          </Text>
          
          <Button
            href={props.preferencesUrl}
            style={mergedStyles.button}
          >
            {customContent?.ctaText || 'Manage Preferences'}
          </Button>
        </>
      )}
      
      <Text style={mergedStyles.text}>
        {customContent?.closing || 'If you have any questions or feedback, feel free to reply to this email. We\'d love to hear from you!'}
      </Text>
      
      <Text style={mergedStyles.text}>
        Best regards,<br />
        The Team
      </Text>
    </BaseTemplate>
  )
}