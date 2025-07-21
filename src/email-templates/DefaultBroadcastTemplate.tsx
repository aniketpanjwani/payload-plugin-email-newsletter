import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface BroadcastTemplateProps {
  subject: string
  preheader?: string
  content: string
}

export const DefaultBroadcastTemplate: React.FC<BroadcastTemplateProps> = ({
  subject,
  preheader,
  content,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preheader || subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={contentSection}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </Section>
          
          <Hr style={divider} />
          
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this email because you subscribed to our newsletter.
            </Text>
            <Text style={footerText}>
              <Link href="{{unsubscribe_url}}" style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Clean, modern styles
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

const contentSection = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '40px 0 20px',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#6b7280',
  margin: '0 0 10px',
}

const footerLink = {
  color: '#6b7280',
  textDecoration: 'underline',
}

export default DefaultBroadcastTemplate