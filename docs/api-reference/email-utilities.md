# Email Utilities API Reference

This document covers the email-safe HTML utilities provided by the Payload Newsletter Plugin.

## Email Content Field

### `createEmailContentField(overrides?: Partial<RichTextField>): RichTextField`

Creates an email-safe rich text field configuration with limited Lexical features.

```typescript
import { createEmailContentField } from 'payload-plugin-newsletter/fields'

const field = createEmailContentField({
  name: 'emailBody', // Override default name
  required: false,   // Override required setting
  admin: {
    description: 'Custom description'
  }
})
```

### `emailSafeFeatures`

Pre-configured array of Lexical features safe for email:

```typescript
import { emailSafeFeatures } from 'payload-plugin-newsletter/fields'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

const customField = {
  name: 'content',
  type: 'richText',
  editor: lexicalEditor({
    features: emailSafeFeatures
  })
}
```

## HTML Conversion

### `convertToEmailSafeHtml(editorState: SerializedEditorState): Promise<string>`

Converts Lexical editor state to email-safe HTML with inline styles.

```typescript
import { convertToEmailSafeHtml } from 'payload-plugin-newsletter/utils'

const html = await convertToEmailSafeHtml(editorState)
// Returns: <p style="margin: 0 0 16px 0;">Content with inline styles</p>
```

Features:
- Converts all styles to inline CSS
- Sanitizes HTML for security
- Handles all email-safe node types
- Adds email-compatible styles

### `EMAIL_SAFE_CONFIG`

DOMPurify configuration for email sanitization:

```typescript
import { EMAIL_SAFE_CONFIG } from 'payload-plugin-newsletter/utils'
import DOMPurify from 'isomorphic-dompurify'

const cleanHtml = DOMPurify.sanitize(dirtyHtml, EMAIL_SAFE_CONFIG)
```

## HTML Validation

### `validateEmailHtml(html: string): ValidationResult`

Validates HTML for email client compatibility.

```typescript
import { validateEmailHtml } from 'payload-plugin-newsletter/utils'

const result = validateEmailHtml(html)

if (!result.valid) {
  console.error('Email HTML errors:', result.errors)
  console.warn('Email HTML warnings:', result.warnings)
}

// Access statistics
console.log(`Size: ${result.stats.sizeInBytes} bytes`)
console.log(`Images: ${result.stats.imageCount}`)
console.log(`Links: ${result.stats.linkCount}`)
```

### `ValidationResult` Interface

```typescript
interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  stats: {
    sizeInBytes: number
    imageCount: number
    linkCount: number
    hasExternalStyles: boolean
    hasJavaScript: boolean
  }
}
```

## React Components

### `EmailPreview`

Real-time email preview component with validation.

```typescript
import { EmailPreview } from 'payload-plugin-newsletter/components'

<EmailPreview
  content={editorState}           // Lexical SerializedEditorState
  subject="Email Subject"         // Email subject line
  preheader="Preview text"        // Optional preheader
  channel={channelData}           // Optional channel config
  mode="desktop"                  // 'desktop' | 'mobile'
  onValidation={(result) => {     // Validation callback
    console.log(result)
  }}
/>
```

### `EmailPreviewField`

Payload UI field component for email preview.

```typescript
{
  name: 'emailPreview',
  type: 'ui',
  admin: {
    components: {
      Field: 'payload-plugin-newsletter/components/EmailPreviewField'
    }
  }
}
```

## Endpoints

### Test Email Endpoint

```
POST /api/broadcasts/:id/test
```

Sends a test email for the specified broadcast.

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to send test email: [reason]"
}
```

## Usage Examples

### Complete Email Field Setup

```typescript
import { createEmailContentField } from 'payload-plugin-newsletter/fields'

const BroadcastsCollection = {
  slug: 'broadcasts',
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    createEmailContentField({
      admin: {
        description: 'Email content with limited formatting'
      }
    }),
    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: 'payload-plugin-newsletter/components/EmailPreviewField'
        }
      }
    }
  ]
}
```

### Custom Email Validation

```typescript
import { validateEmailHtml } from 'payload-plugin-newsletter/utils'

const customValidate = (html: string) => {
  const result = validateEmailHtml(html)
  
  // Add custom rules
  if (html.includes('unsubscribe')) {
    result.warnings.push('Missing unsubscribe link')
  }
  
  return result
}
```

### Hook Integration

```typescript
import { convertToEmailSafeHtml } from 'payload-plugin-newsletter/utils'

const beforeChangeHook = async ({ data, req }) => {
  if (data.content) {
    // Convert to email-safe HTML before saving
    data.emailHtml = await convertToEmailSafeHtml(data.content)
  }
  return data
}
```

## TypeScript Support

All utilities are fully typed. Import types as needed:

```typescript
import type { 
  ValidationResult,
  EmailPreviewProps 
} from 'payload-plugin-newsletter/types'
```

## Browser Compatibility

- Email preview uses iframes (all modern browsers)
- DOMPurify requires DOM environment
- Server-side rendering supported via isomorphic-dompurify
- Lexical editor requires modern browser features