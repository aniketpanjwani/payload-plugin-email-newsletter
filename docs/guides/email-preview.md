# Email Preview Guide

This guide covers the email preview functionality in the Payload Newsletter Plugin, including email-safe content editing, real-time preview, and validation features.

## Overview

The email preview system provides:
- **Email-safe rich text editor** with limited features for compatibility
- **Real-time preview** showing how emails will appear in different clients
- **Validation system** to catch common email HTML issues
- **Test email functionality** to preview in actual email clients

## Email-Safe Content Editor

### Limited Feature Set

The email content editor uses a restricted set of Lexical features that work reliably across email clients:

- **Text Formatting**: Bold, italic, underline, strikethrough
- **Links**: Simple URL links (no JavaScript)
- **Lists**: Ordered and unordered lists
- **Headings**: H1, H2, and H3 only
- **Alignment**: Left, center, right text alignment
- **Blockquotes**: For quoted content

Features intentionally excluded:
- Tables (use the dedicated table feature if needed)
- Images (use dedicated image fields)
- Videos, embeds, or interactive content
- Custom fonts or advanced typography
- JavaScript-dependent features

### Why These Limitations?

Email clients have vastly different HTML/CSS support compared to web browsers:
- No JavaScript execution
- Limited CSS support (many clients strip `<style>` tags)
- Inline styles required for consistent rendering
- Many modern CSS features unsupported

## Real-Time Email Preview

### Preview Modes

The preview component offers two viewport modes:

1. **Desktop Preview** (600px width)
   - Shows how emails appear on desktop clients
   - Standard width for responsive email design

2. **Mobile Preview** (320px width)
   - Shows how emails appear on mobile devices
   - Helps ensure content remains readable on small screens

### Preview Features

- **Live Updates**: Changes in the editor immediately reflect in the preview
- **Accurate Rendering**: Converts content to email-safe HTML with inline styles
- **Validation Feedback**: Shows errors and warnings inline
- **Viewport Simulation**: Accurate representation of different screen sizes

## Email HTML Validation

The validation system checks for common email compatibility issues:

### Errors (Must Fix)

- **JavaScript**: Any scripts or event handlers
- **External Stylesheets**: `<link>` tags for CSS
- **Unsupported Tags**: `<video>`, `<audio>`, `<canvas>`, `<svg>`, etc.
- **Forms**: Form elements don't work reliably in email
- **Advanced CSS**: Flexbox, Grid, fixed positioning

### Warnings (Should Fix)

- **Size Limits**: HTML over 102KB may be clipped by Gmail
- **Missing Alt Text**: Images without alt attributes
- **External Links**: Links without proper attributes
- **Legacy CSS Issues**: Properties that don't work in Outlook

### Best Practices

1. **Keep HTML Under 100KB**: Avoid Gmail clipping
2. **Use Inline Styles**: Don't rely on CSS classes
3. **Test Across Clients**: Use the test email feature
4. **Provide Alt Text**: Improve accessibility
5. **Avoid Background Images**: Use regular `<img>` tags instead

## Test Email Feature

Send test emails to preview how your broadcast will appear:

1. Save your broadcast first
2. Click "Send Test Email" in the preview toolbar
3. Check your inbox for the test email
4. Review rendering in your actual email client

Test emails:
- Use your channel's configured sender
- Include all content conversions
- Show actual email client rendering
- Help identify client-specific issues

## Integration with Broadcasts

The email preview system is automatically integrated with broadcast editing:

```typescript
// Broadcasts automatically use email-safe content
{
  name: 'content',
  type: 'richText',
  editor: lexicalEditor({
    features: emailSafeFeatures, // Pre-configured for email
  }),
}
```

## Customization

### Custom Validation Rules

Add custom validation rules by extending the validation function:

```typescript
import { validateEmailHtml } from 'payload-plugin-newsletter/utils'

const customValidate = (html: string) => {
  const baseResult = validateEmailHtml(html)
  
  // Add custom checks
  if (html.includes('confidential')) {
    baseResult.warnings.push('Contains potentially sensitive content')
  }
  
  return baseResult
}
```

### Preview Templates

Wrap preview content in your email template for more accurate previews:

```typescript
const wrapInTemplate = (content: string, subject: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          ${content}
        </div>
      </body>
    </html>
  `
}
```

## Troubleshooting

### Preview Not Updating

- Ensure the content field is properly configured
- Check browser console for errors
- Verify the preview component is receiving updated content

### Validation Errors

- Review the specific error messages
- Use the inline style converter for CSS
- Remove unsupported HTML elements
- Test with simpler content first

### Test Emails Not Sending

- Verify email provider configuration
- Check server logs for errors
- Ensure test recipient is configured
- Confirm broadcast is saved first

## Email Client Compatibility

The email-safe HTML is tested with:

- **Gmail**: Web, iOS, Android
- **Outlook**: 2019, 365, Web
- **Apple Mail**: macOS, iOS
- **Yahoo Mail**: Web, Mobile
- **Mobile Clients**: Native iOS/Android apps

For maximum compatibility:
1. Use table-based layouts for complex designs
2. Stick to web-safe fonts
3. Test dark mode rendering
4. Avoid CSS3 properties
5. Include fallbacks for everything