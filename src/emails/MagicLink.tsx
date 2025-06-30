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

export interface MagicLinkEmailProps {
  magicLink: string
  email: string
  siteName?: string
  expiresIn?: string
}

export const MagicLinkEmail: React.FC<MagicLinkEmailProps> = ({
  magicLink,
  email,
  siteName = 'Newsletter',
  expiresIn = '24 hours',
}) => {
  const previewText = `Sign in to ${siteName}`
  
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Text style={styles.heading}>Sign in to {siteName}</Text>
          
          <Text style={styles.text}>
            Hi {email.split('@')[0]},
          </Text>
          
          <Text style={styles.text}>
            We received a request to sign in to your {siteName} account. 
            Click the button below to complete your sign in:
          </Text>
          
          <Button href={magicLink} style={styles.button}>
            Sign in to {siteName}
          </Button>
          
          <Text style={styles.text}>
            Or copy and paste this URL into your browser:
          </Text>
          
          <code style={styles.code}>{magicLink}</code>
          
          <Hr style={styles.hr} />
          
          <Text style={styles.footer}>
            This link will expire in {expiresIn}. If you didn't request this email, 
            you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail