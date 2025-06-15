import React from 'react'
import {
  Heading,
  Text,
  Link,
  Img,
  Button,
  Markdown,
} from '@react-email/components'
import { BaseTemplate, baseStyles } from './BaseTemplate'

export interface NewsletterTemplateProps {
  subject: string
  preheader?: string
  title?: string
  content: string // Markdown content
  ctaButton?: {
    text: string
    href: string
  }
  footer?: {
    unsubscribeUrl?: string
    preferencesUrl?: string
    address?: string
    copyright?: string
  }
}

const newsletterStyles = {
  heading: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 24px 0',
  },
  markdown: {
    h1: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: '32px 0 16px 0',
    },
    h2: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: '24px 0 12px 0',
    },
    h3: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#1a1a1a',
      margin: '20px 0 8px 0',
    },
    p: {
      fontSize: '16px',
      lineHeight: '24px',
      color: '#4a4a4a',
      margin: '0 0 16px 0',
    },
    a: {
      color: '#0066cc',
      textDecoration: 'underline',
    },
    ul: {
      paddingLeft: '20px',
      margin: '0 0 16px 0',
    },
    ol: {
      paddingLeft: '20px',
      margin: '0 0 16px 0',
    },
    li: {
      fontSize: '16px',
      lineHeight: '24px',
      color: '#4a4a4a',
      marginBottom: '8px',
    },
    img: {
      maxWidth: '100%',
      height: 'auto',
      margin: '16px 0',
    },
    blockquote: {
      borderLeft: '4px solid #e6ebf1',
      paddingLeft: '16px',
      margin: '0 0 16px 0',
      fontStyle: 'italic',
      color: '#6a6a6a',
    },
    code: {
      backgroundColor: '#f6f8fa',
      padding: '2px 4px',
      borderRadius: '3px',
      fontFamily: 'monospace',
      fontSize: '14px',
    },
    pre: {
      backgroundColor: '#f6f8fa',
      padding: '16px',
      borderRadius: '6px',
      overflow: 'auto',
      margin: '0 0 16px 0',
    },
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
    padding: '12px 20px',
    margin: '32px 0',
  },
}

export const NewsletterTemplate: React.FC<NewsletterTemplateProps> = ({
  subject,
  preheader,
  title,
  content,
  ctaButton,
  footer,
}) => {
  return (
    <BaseTemplate
      preview={preheader || subject}
      footer={footer}
    >
      {title && (
        <Heading style={newsletterStyles.heading}>
          {title}
        </Heading>
      )}
      
      <Markdown
        markdownCustomStyles={newsletterStyles.markdown}
        markdownContainerStyles={{
          padding: '0',
        }}
      >
        {content}
      </Markdown>
      
      {ctaButton && (
        <Button
          href={ctaButton.href}
          style={newsletterStyles.button}
        >
          {ctaButton.text}
        </Button>
      )}
    </BaseTemplate>
  )
}

// Export a function that creates a custom newsletter template
export function createNewsletterTemplate(
  customStyles?: Partial<typeof newsletterStyles>
): React.FC<NewsletterTemplateProps> {
  const mergedStyles = {
    ...newsletterStyles,
    ...customStyles,
  }
  
  return (props: NewsletterTemplateProps) => (
    <BaseTemplate
      preview={props.preheader || props.subject}
      footer={props.footer}
    >
      {props.title && (
        <Heading style={mergedStyles.heading}>
          {props.title}
        </Heading>
      )}
      
      <Markdown
        markdownCustomStyles={mergedStyles.markdown}
        markdownContainerStyles={{
          padding: '0',
        }}
      >
        {props.content}
      </Markdown>
      
      {props.ctaButton && (
        <Button
          href={props.ctaButton.href}
          style={mergedStyles.button}
        >
          {props.ctaButton.text}
        </Button>
      )}
    </BaseTemplate>
  )
}