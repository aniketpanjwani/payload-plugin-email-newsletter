import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import { styles } from './styles'

export interface WelcomeEmailProps {
  email: string
  siteName?: string
  preferencesUrl?: string
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  email,
  siteName = 'Newsletter',
  preferencesUrl,
}) => {
  const previewText = `Welcome to ${siteName}!`
  const firstName = email.split('@')[0]
  
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Text style={styles.heading}>Welcome to {siteName}! 🎉</Text>
          
          <Text style={styles.text}>
            Hi {firstName},
          </Text>
          
          <Text style={styles.text}>
            Thanks for subscribing to {siteName}! We're excited to have you as part 
            of our community.
          </Text>
          
          <Text style={styles.text}>
            You'll receive our newsletter based on your preferences. Speaking of which, 
            you can update your preferences anytime:
          </Text>
          
          {preferencesUrl && (
            <Button href={preferencesUrl} style={styles.button}>
              Manage Preferences
            </Button>
          )}
          
          <Text style={styles.text}>
            Here's what you can expect from us:
          </Text>
          
          <Text style={styles.text}>
            • Regular updates based on your chosen frequency<br />
            • Content tailored to your interests<br />
            • Easy unsubscribe options in every email<br />
            • Your privacy respected always
          </Text>
          
          <Hr style={styles.hr} />
          
          <Text style={styles.footer}>
            If you have any questions, feel free to reply to this email. 
            We're here to help!
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail