# Quick Start Guide

Get your newsletter system up and running in 5 minutes!

## Prerequisites

- Payload CMS 3.x project
- Node.js 18 or 20
- An email service account (Resend or Broadcast)

## Installation

```bash
npm install payload-plugin-newsletter
# or
yarn add payload-plugin-newsletter
# or
bun add payload-plugin-newsletter
```

## Basic Setup

### 1. Configure the Plugin

Add to your `payload.config.ts`:

```typescript
import { buildConfig } from 'payload'
import { newsletterPlugin } from 'payload-plugin-newsletter'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      emailProvider: {
        provider: 'resend',
        config: {
          apiKey: process.env.RESEND_API_KEY!,
          fromAddress: 'newsletter@example.com',
          fromName: 'My Newsletter'
        }
      }
    })
  ],
  // ... rest of your config
})
```

### 2. Set Environment Variables

Create or update your `.env` file:

```bash
# Required
RESEND_API_KEY=your_resend_api_key_here
JWT_SECRET=your_jwt_secret_here

# Optional
NEWSLETTER_FROM_EMAIL=newsletter@example.com
NEWSLETTER_FROM_NAME=My Newsletter
```

### 3. Add a Signup Form

In your Next.js app:

```tsx
import { NewsletterForm } from 'payload-plugin-newsletter/client'

export default function HomePage() {
  return (
    <div>
      <h1>Subscribe to our Newsletter</h1>
      <NewsletterForm 
        onSuccess={(subscriber) => {
          console.log('New subscriber:', subscriber)
        }}
      />
    </div>
  )
}
```

### 4. Test Your Setup

1. Start your Payload server
2. Visit your signup form
3. Subscribe with a test email
4. Check the Payload admin panel under "Subscribers"

## What's Next?

- [Configure authentication](./configuration.md#authentication)
- [Customize email templates](../guides/templates.md)
- [Set up double opt-in](../guides/authentication.md#double-opt-in)
- [Add subscriber preferences](../guides/subscriber-management.md#preferences)

## Common Issues

### API Key Not Working
Make sure your environment variables are loaded correctly and the API key is valid.

### Emails Not Sending
Check that your email provider account is verified and has sending permissions.

### Types Not Found
If using TypeScript, you may need to add the types path to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "payload-plugin-newsletter/*": ["./node_modules/payload-plugin-newsletter/dist/*"]
    }
  }
}
```