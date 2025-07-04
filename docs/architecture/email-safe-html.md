# Email-Safe HTML Architecture

This document explains how the Payload Newsletter Plugin ensures that content created in the Lexical rich text editor is converted to email-safe HTML that renders consistently across email clients.

## The Challenge

Email clients have significant limitations compared to web browsers:
- No JavaScript execution
- Limited CSS support (varies by client)
- No external stylesheets (many clients strip `<style>` tags)
- Strict security filtering
- Size limitations (Gmail clips emails over 102KB)
- Inconsistent rendering engines

## Our Solution

### 1. Limited Feature Set

We configure Lexical with only email-safe features:

```typescript
export const emailSafeFeatures = [
  BoldFeature(),
  ItalicFeature(), 
  UnderlineFeature(),
  StrikethroughFeature(),
  LinkFeature(),
  OrderedListFeature(),
  UnorderedListFeature(),
  HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3'] }),
  ParagraphFeature(),
  AlignFeature(),
  BlockquoteFeature(),
]
```

Explicitly excluded:
- **Tables**: Poor support, especially in Outlook
- **Media embeds**: No video/audio support in email
- **Code blocks**: `<pre>` tags render inconsistently
- **Advanced layouts**: Flexbox/Grid not supported
- **Custom blocks**: May not render correctly

### 2. Custom HTML Conversion

Instead of using the default Lexical HTML converter, we implement email-specific conversions:

```typescript
const emailSafeConverters = {
  paragraph: ({ node }) => {
    const align = node.format || 'left'
    return `<p style="margin: 0 0 16px 0; text-align: ${align};">${node.children}</p>`
  },
  heading: ({ node }) => {
    const styles = {
      h1: 'font-size: 32px; font-weight: 700; margin: 0 0 24px 0;',
      h2: 'font-size: 24px; font-weight: 600; margin: 0 0 16px 0;',
      h3: 'font-size: 20px; font-weight: 600; margin: 0 0 12px 0;',
    }
    return `<${node.tag} style="${styles[node.tag]}">${node.children}</${node.tag}>`
  },
  // ... more converters
}
```

Key principles:
- All styles are inline (no classes)
- Use pixel values, not rem/em
- Include all spacing in style attributes
- Add necessary email attributes (target="_blank" on links)

### 3. HTML Sanitization

We use DOMPurify with strict email-safe configuration:

```typescript
const EMAIL_SAFE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span',
    'a', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li',
    'blockquote', 'hr'
  ],
  ALLOWED_ATTR: ['href', 'style', 'target', 'rel'],
  ALLOWED_STYLES: {
    '*': [
      'color', 'background-color', 'font-size', 'font-weight',
      'font-style', 'text-decoration', 'text-align', 'margin',
      'padding', 'line-height', 'border-left'
    ],
  },
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
}
```

### 4. Validation System

Before sending, we validate the HTML:

```typescript
export function validateEmailHtml(html: string) {
  const warnings = []
  const errors = []
  
  // Check for problematic patterns
  if (html.includes('position:')) {
    errors.push('Position CSS is not supported in email')
  }
  
  if (html.length > 102400) {
    warnings.push('Email may be clipped in Gmail (over 100KB)')
  }
  
  return { valid: errors.length === 0, warnings, errors }
}
```

## Email Client Compatibility

### Gmail
- Clips messages over 102KB
- Strips `<style>` tags in some contexts
- Doesn't support negative margins
- Limited pseudo-selector support

### Outlook (Desktop)
- Uses Word rendering engine
- No support for `margin: auto`
- Requires tables for complex layouts
- Limited CSS support

### Apple Mail
- Best CSS support
- Supports media queries
- Handles most modern CSS

### Mobile Clients
- Smaller viewports (320-414px)
- Touch targets need to be larger
- Some strip media queries

## Best Practices

### 1. Typography
```css
/* Use web-safe font stacks */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;

/* Use pixel sizes for consistency */
font-size: 16px;
line-height: 24px;
```

### 2. Spacing
```css
/* Use margin instead of padding on text elements */
margin: 0 0 16px 0;

/* Avoid negative margins */
/* margin-top: -10px; ❌ */
```

### 3. Colors
```css
/* Use hex colors, not RGB/HSL */
color: #333333; /* ✓ */
/* color: rgb(51, 51, 51); ❌ */

/* Ensure sufficient contrast */
/* Minimum 4.5:1 for body text */
```

### 4. Links
```html
<!-- Always include href and security attributes -->
<a href="https://example.com" 
   target="_blank" 
   rel="noopener noreferrer"
   style="color: #0066cc; text-decoration: underline;">
  Link text
</a>
```

## Testing Strategy

### 1. Preview Testing
- Real-time preview in split view
- Desktop and mobile viewports
- Validation warnings displayed

### 2. Test Emails
- Send to personal email
- Check rendering in multiple clients
- Verify all links work
- Test on mobile devices

### 3. Email Client Testing Tools
- Litmus (recommended)
- Email on Acid
- Mail Tester (for deliverability)

## Future Improvements

1. **Client-Specific Rendering**: Different HTML for Outlook vs modern clients
2. **Dark Mode Support**: Using `@media (prefers-color-scheme: dark)`
3. **AMP Email Support**: For interactive email experiences
4. **Accessibility Enhancements**: Better screen reader support
5. **Template Variables**: More sophisticated personalization

## Implementation Checklist

- [ ] Configure Lexical with limited features
- [ ] Implement custom HTML converters
- [ ] Add DOMPurify sanitization
- [ ] Create validation system
- [ ] Build preview component
- [ ] Test in major email clients
- [ ] Document supported features
- [ ] Add user warnings for unsupported content