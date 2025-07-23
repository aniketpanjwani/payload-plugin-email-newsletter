# Email Templates Guide

This guide covers how to customize email templates for both transactional emails (magic links, welcome emails) and broadcast newsletters.

## Overview

The Payload Newsletter Plugin supports two types of email templates:

1. **Transactional Templates** - For system emails like magic links and welcome messages
2. **Broadcast Templates** - For newsletter broadcasts sent to subscribers

## Broadcast Templates

### Using Custom Broadcast Templates

The plugin automatically looks for a custom broadcast template in your project. To use a custom template:

1. Create a file at `email-templates/broadcast-template.tsx` in your project root:

```typescript
import React from 'react'
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Img,
  Button,
} from '@react-email/components'

export interface BroadcastTemplateProps {
  subject: string
  preheader?: string
  content: string
}

export const BroadcastTemplate: React.FC<BroadcastTemplateProps> = ({
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
          {/* Your custom header */}
          <Section style={header}>
            <Img 
              src="https://example.com/logo.png" 
              width="150" 
              height="50" 
              alt="Your Brand"
            />
          </Section>
          
          {/* Main content - IMPORTANT: Use dangerouslySetInnerHTML */}
          <Section style={contentSection}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </Section>
          
          {/* Custom footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              © 2024 Your Company. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="{{unsubscribe_url}}" style={footerLink}>
                Unsubscribe
              </Link>
              {' • '}
              <Link href="{{preferences_url}}" style={footerLink}>
                Update Preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Define your styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const header = {
  padding: '32px 20px',
  textAlign: 'center' as const,
}

const contentSection = {
  padding: '0 32px',
  fontSize: '16px',
  lineHeight: '1.7',
  color: '#334155',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '48px 0 24px',
}

const footer = {
  textAlign: 'center' as const,
  padding: '0 32px',
}

const footerText = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#64748b',
  margin: '0 0 10px',
}

const footerLink = {
  color: '#64748b',
  textDecoration: 'underline',
}

// Export as default for the template loader
export default BroadcastTemplate
```

2. The plugin will automatically detect and use your custom template when rendering broadcast emails.

### Template Props

Your broadcast template receives these props:

- `subject: string` - The email subject line
- `preheader?: string` - Optional preview text
- `content: string` - HTML content from the Lexical editor (already sanitized)

### Important Notes

1. **Always use `dangerouslySetInnerHTML`** for the content prop - it contains pre-rendered HTML from the Lexical editor
2. **Include unsubscribe link** - Use `{{unsubscribe_url}}` placeholder (required by email regulations)
3. **Test your template** - Use the email preview feature in the broadcast editor

### Template Variables

These variables are automatically replaced in your templates:

- `{{unsubscribe_url}}` - One-click unsubscribe link
- `{{preferences_url}}` - Link to subscriber preferences
- `{{browser_url}}` - View in browser link

## Transactional Email Templates

The plugin supports custom templates for all transactional emails (v0.14.2+).

### Using Custom Transactional Templates

To use custom templates for transactional emails, provide them in your plugin configuration:

```typescript
import { newsletterPlugin } from 'payload-plugin-newsletter'
import { MagicLinkTemplate } from './email-templates/MagicLinkTemplate'
import { WelcomeTemplate } from './email-templates/WelcomeTemplate'
import { SignInTemplate } from './email-templates/SignInTemplate'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      // ... other config
      customTemplates: {
        'magic-link': MagicLinkTemplate,
        'welcome': WelcomeTemplate,
        'signin': SignInTemplate,
      },
    }),
  ],
})
```

### Creating Custom Templates

Here's an example custom magic link template:

```typescript
// email-templates/MagicLinkTemplate.tsx
import React from 'react'
import {
  Body,
  Button,
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

interface MagicLinkTemplateProps {
  magicLink: string
  email: string
  siteName?: string
  expiresIn?: string
}

export const MagicLinkTemplate: React.FC<MagicLinkTemplateProps> = ({
  magicLink,
  email,
  siteName = 'Our Site',
  expiresIn = '7 days',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Sign in to {siteName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Sign in to {siteName}</Heading>
          
          <Text style={text}>
            Hi {email},
          </Text>
          
          <Text style={text}>
            Click the button below to sign in to your account:
          </Text>
          
          <Section style={buttonContainer}>
            <Button href={magicLink} style={button}>
              Sign In
            </Button>
          </Section>
          
          <Text style={text}>
            Or copy and paste this URL into your browser:
          </Text>
          
          <code style={code}>{magicLink}</code>
          
          <Hr style={hr} />
          
          <Text style={footer}>
            This link will expire in {expiresIn}. If you didn't request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
  fontWeight: 'bold',
}

const code = {
  display: 'block',
  padding: '16px',
  backgroundColor: '#f4f4f4',
  borderRadius: '4px',
  margin: '16px 0',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
}
```

### Template Props by Type

Each template type receives specific props:

#### Magic Link Template
```typescript
interface MagicLinkTemplateProps {
  magicLink: string      // The magic link URL
  email: string          // Subscriber's email
  siteName?: string      // Site name from settings
  expiresIn?: string     // Token expiration time
}
```

#### Welcome Template
```typescript
interface WelcomeTemplateProps {
  email: string          // Subscriber's email
  siteName?: string      // Site name from settings
  preferencesUrl?: string // URL to manage preferences
}
```

#### Sign-in Template
```typescript
interface SignInTemplateProps {
  magicLink: string      // The sign-in link URL
  email: string          // Subscriber's email
  siteName?: string      // Site name from settings
  expiresIn?: string     // Token expiration time
}
```

### Fallback Behavior

If you don't provide a custom template for a specific type, the plugin will use its built-in template. This allows you to customize only the templates you need:

```typescript
customTemplates: {
  // Only customize the magic link template
  'magic-link': MagicLinkTemplate,
  // 'welcome' and 'signin' will use built-in templates
}
```

## Extending Template Functionality

### Adding Dynamic Content Blocks

For users who want to build advanced features like dynamic content blocks, here's how to extend the system:

1. **Create a Template Context Provider**:

```typescript
// email-templates/context/TemplateContext.tsx
import React, { createContext, useContext } from 'react'

interface TemplateContextValue {
  subscriber?: {
    email: string
    name?: string
    customFields?: Record<string, any>
  }
  campaign?: {
    id: string
    tags?: string[]
  }
}

const TemplateContext = createContext<TemplateContextValue>({})

export const useTemplateContext = () => useContext(TemplateContext)
export const TemplateProvider = TemplateContext.Provider
```

2. **Create Reusable Components**:

```typescript
// email-templates/components/ConditionalBlock.tsx
import React from 'react'
import { useTemplateContext } from '../context/TemplateContext'

interface ConditionalBlockProps {
  showIf: (context: any) => boolean
  children: React.ReactNode
}

export const ConditionalBlock: React.FC<ConditionalBlockProps> = ({ 
  showIf, 
  children 
}) => {
  const context = useTemplateContext()
  return showIf(context) ? <>{children}</> : null
}
```

3. **Use in Your Template**:

```typescript
<ConditionalBlock showIf={(ctx) => ctx.subscriber?.customFields?.isPremium}>
  <Section style={premiumSection}>
    <Text>Exclusive content for premium subscribers!</Text>
  </Section>
</ConditionalBlock>
```

### Creating a Template Library

You can create multiple templates and switch between them:

```typescript
// email-templates/templates/index.ts
import { DefaultTemplate } from './DefaultTemplate'
import { MinimalTemplate } from './MinimalTemplate'
import { NewsletterTemplate } from './NewsletterTemplate'

const templates = {
  default: DefaultTemplate,
  minimal: MinimalTemplate,
  newsletter: NewsletterTemplate,
}

// Select template based on broadcast metadata
export function selectTemplate(broadcast: any) {
  const templateName = broadcast.metadata?.template || 'default'
  return templates[templateName] || templates.default
}
```

## Best Practices

1. **Mobile Responsiveness** - Always test templates on mobile devices
2. **Email Client Compatibility** - Use React Email components for maximum compatibility
3. **Accessibility** - Include alt text for images and proper heading hierarchy
4. **Performance** - Keep templates lightweight, avoid heavy images
5. **Legal Compliance** - Always include unsubscribe links and company information

## Testing Templates

### Using the Preview Feature

1. Edit a broadcast in the admin panel
2. Click "Show Preview" below the content editor
3. Toggle between desktop and mobile views
4. Update content and click "Update Preview" to see changes

### Testing with Real Emails

1. Create a test broadcast
2. Use the "Send Test Email" feature
3. Check rendering in various email clients

## Troubleshooting

### Template Not Loading

If your custom template isn't being used:

1. Verify file location: `email-templates/broadcast-template.tsx`
2. Check for export: Must have either `export default` or `export { BroadcastTemplate }`
3. Look for build errors in your console
4. Ensure React Email dependencies are installed

### Styling Issues

1. Use inline styles or React Email's style props
2. Avoid external CSS files
3. Test in multiple email clients
4. Use React Email's components for consistency

## Future Enhancements

The plugin is designed to be extensible. Future versions may include:

- Custom transactional email templates
- Template selection UI in the admin panel
- Built-in template library
- Dynamic content blocks
- A/B testing support

For now, users can implement these features by extending the plugin using the patterns shown above.