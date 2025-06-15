import React from 'react'
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components'

export interface BaseTemplateProps {
  preview?: string
  children: React.ReactNode
  footer?: {
    unsubscribeUrl?: string
    preferencesUrl?: string
    address?: string
    copyright?: string
  }
}

export const baseStyles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '600px',
  },
  content: {
    padding: '0 20px',
  },
  footer: {
    padding: '32px 20px',
    textAlign: 'center' as const,
  },
  footerText: {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '16px',
    margin: '0',
  },
  footerLink: {
    color: '#8898aa',
    textDecoration: 'underline',
  },
  hr: {
    borderColor: '#e6ebf1',
    margin: '32px 0',
  },
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  preview,
  children,
  footer,
}) => {
  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={baseStyles.main}>
        <Container style={baseStyles.container}>
          <Section style={baseStyles.content}>
            {children}
          </Section>
          
          {footer && (
            <>
              <Hr style={baseStyles.hr} />
              <Section style={baseStyles.footer}>
                {(footer.unsubscribeUrl || footer.preferencesUrl) && (
                  <Text style={baseStyles.footerText}>
                    {footer.preferencesUrl && (
                      <>
                        <Link
                          href={footer.preferencesUrl}
                          style={baseStyles.footerLink}
                        >
                          Manage preferences
                        </Link>
                        {footer.unsubscribeUrl && ' • '}
                      </>
                    )}
                    {footer.unsubscribeUrl && (
                      <Link
                        href={footer.unsubscribeUrl}
                        style={baseStyles.footerLink}
                      >
                        Unsubscribe
                      </Link>
                    )}
                  </Text>
                )}
                
                {footer.address && (
                  <Text style={{ ...baseStyles.footerText, marginTop: '16px' }}>
                    {footer.address}
                  </Text>
                )}
                
                {footer.copyright && (
                  <Text style={{ ...baseStyles.footerText, marginTop: '8px' }}>
                    {footer.copyright}
                  </Text>
                )}
              </Section>
            </>
          )}
        </Container>
      </Body>
    </Html>
  )
}