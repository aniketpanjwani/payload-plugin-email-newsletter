# Email Preview Feature

The Payload Newsletter Plugin includes a built-in email preview feature that allows you to see how your broadcasts will look before sending them.

## Overview

The email preview feature provides:
- Live preview of your email content
- Desktop and mobile view toggles
- React Email template rendering
- Custom template support

## How It Works

When you're editing a broadcast, you'll see an "Email Preview" section below the content editor. Click "Show Preview" to see how your email will render.

### Features

1. **Manual Updates**: Click "Update Preview" to refresh the preview with your latest changes
2. **Responsive Views**: Toggle between desktop (600px) and mobile (375px) views
3. **Email-Safe HTML**: Your content is automatically converted to email-safe HTML
4. **Template System**: Uses React Email for reliable rendering across email clients

## Custom Templates

By default, the plugin uses a clean, modern email template. You can customize this by creating your own template:

### 1. Create Your Template File

Create a file at `email-templates/broadcast-template.tsx` in your project root:

```typescript
import React from 'react'
import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface BroadcastTemplateProps {
  subject: string
  preheader?: string
  content: string
}

export default function BroadcastTemplate({
  subject,
  preheader,
  content,
}: BroadcastTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{preheader || subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Your header/logo here */}
          
          <Section style={contentSection}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </Section>
          
          <Section style={footer}>
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

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
}

// ... more styles
```

### 2. Template Requirements

- Must export a React component (default export or named `BroadcastTemplate`)
- Receives props: `subject`, `preheader`, and `content`
- The `content` prop contains email-safe HTML - render it with `dangerouslySetInnerHTML`
- Include `{{unsubscribe_url}}` for the unsubscribe link (Broadcast will replace it)

### 3. Supported Content

The email editor supports:
- Rich text formatting (bold, italic, underline, etc.)
- Headings (H1-H6)
- Lists (ordered and unordered)
- Links
- Images (with Media collection integration)
- Custom blocks (buttons, dividers)
- Blockquotes
- Horizontal rules

## Best Practices

1. **Test Different Clients**: While the preview shows ideal rendering, always send test emails to check different email clients
2. **Keep Templates Simple**: Email clients have limited CSS support
3. **Use Inline Styles**: Always use inline styles instead of CSS classes
4. **Mobile-First**: Design for mobile devices first
5. **Alt Text**: Always include alt text for images

## Troubleshooting

### Preview Not Updating
Make sure to click "Update Preview" after making changes. The preview doesn't update automatically to prevent performance issues with large emails.

### Template Not Loading
- Check that your template file is at `email-templates/broadcast-template.tsx`
- Ensure it exports a valid React component
- Check the browser console for error messages

### Images Not Showing
- Ensure your Media collection is properly configured
- Check that images are uploaded and accessible
- Verify the media URL is correct in your Payload config

## Configuration

The preview feature is automatically enabled when you use the broadcast feature. No additional configuration is required.

```typescript
newsletterPlugin({
  features: {
    newsletterManagement: {
      enabled: true,
      // Email preview is included automatically
    },
  },
})
```