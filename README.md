# Payload Newsletter Plugin

A complete newsletter management plugin for Payload CMS that provides subscriber management, magic link authentication, and email service integration out of the box.

## Features

- 📧 **Complete Subscriber Management** - Ready-to-use subscriber collection with all essential fields
- 🔐 **Magic Link Authentication** - Passwordless authentication for subscribers (separate from Payload auth)
- 📨 **Email Service Integration** - Built-in support for Resend and Broadcast
- 📅 **Newsletter Scheduling** - Schedule newsletters from your articles collection
- ⚛️ **React Components** - Pre-built signup forms and preference management UI
- 🌍 **Internationalization** - Multi-language support built-in
- 📊 **Analytics Ready** - UTM tracking and signup metadata collection
- ⚙️ **Admin UI Configuration** - Manage email settings through Payload admin panel

## Quick Start

### 1. Install the plugin

```bash
npm install @payloadcms/plugin-newsletter
# or
yarn add @payloadcms/plugin-newsletter
# or
pnpm add @payloadcms/plugin-newsletter
```

### 2. Add to your Payload config

```typescript
import { buildConfig } from 'payload/config'
import { newsletterPlugin } from '@payloadcms/plugin-newsletter'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      // Choose your email provider
      providers: {
        default: 'resend', // or 'broadcast'
        resend: {
          apiKey: process.env.RESEND_API_KEY,
          fromAddress: 'hello@yoursite.com',
          fromName: 'Your Newsletter',
          audienceIds: {
            en: {
              production: 'your_audience_id',
              development: 'your_dev_audience_id',
            },
          },
        },
      },
    }),
  ],
  // ... rest of your config
})
```

### 3. That's it! 🎉

The plugin automatically adds:
- A `subscribers` collection to manage your subscribers
- A `newsletter-settings` global for email configuration
- API endpoints for subscription and authentication
- Newsletter scheduling fields to your articles (optional)

## Basic Usage

### Frontend Integration

#### Simple Newsletter Signup Form

```tsx
import { NewsletterForm } from '@payloadcms/plugin-newsletter/components'

export function MyHomepage() {
  return (
    <NewsletterForm 
      onSuccess={() => console.log('Subscribed!')}
      onError={(error) => console.error(error)}
    />
  )
}
```

#### Custom Signup Form

```tsx
async function handleSubscribe(email: string) {
  const response = await fetch('/api/newsletter/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  
  if (!response.ok) {
    throw new Error('Subscription failed')
  }
  
  return response.json()
}
```

### Managing Subscribers

Subscribers can be managed through the Payload admin panel at `/admin/collections/subscribers`.

### Email Settings

After setup, configure email settings at `/admin/globals/newsletter-settings` in your admin panel. You can:
- Switch between email providers
- Update API keys and settings
- Customize email templates
- Set subscription preferences

## Configuration Options

### Minimal Configuration

```typescript
newsletterPlugin({
  providers: {
    default: 'resend',
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      fromAddress: 'newsletter@yoursite.com',
      fromName: 'Your Newsletter',
    },
  },
})
```

### Full Configuration

```typescript
newsletterPlugin({
  // Subscriber collection slug (default: 'subscribers')
  subscribersSlug: 'newsletter-subscribers',
  
  // Email providers
  providers: {
    default: 'resend',
    resend: {
      apiKey: process.env.RESEND_API_KEY,
      fromAddress: 'newsletter@yoursite.com',
      fromName: 'Your Newsletter',
      audienceIds: {
        en: {
          production: 'aud_prod_123',
          development: 'aud_dev_123',
        },
        es: {
          production: 'aud_prod_456',
          development: 'aud_dev_456',
        },
      },
    },
  },
  
  // Magic link authentication
  auth: {
    enabled: true,
    tokenExpiration: '7d', // How long magic links are valid
    magicLinkPath: '/newsletter/verify', // Where to redirect for verification
  },
  
  // Features
  features: {
    // Lead magnets (e.g., downloadable PDFs)
    leadMagnets: {
      enabled: true,
      collection: 'media', // Which collection stores your lead magnets
    },
    
    // Post-signup surveys
    surveys: {
      enabled: true,
      questions: [
        {
          id: 'interests',
          question: 'What topics interest you?',
          type: 'multiselect',
          options: ['Tech', 'Business', 'Design'],
        },
      ],
    },
    
    // Newsletter scheduling for articles
    newsletterScheduling: {
      enabled: true,
      articlesCollection: 'posts', // Your articles/posts collection
    },
    
    // UTM tracking
    utmTracking: {
      enabled: true,
      fields: ['source', 'medium', 'campaign', 'content', 'term'],
    },
  },
  
  // Internationalization
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr'],
  },
  
  // Custom hooks
  hooks: {
    afterSubscribe: async ({ doc, req }) => {
      // Send to analytics, CRM, etc.
      console.log('New subscriber:', doc.email)
    },
  },
})
```

## API Endpoints

The plugin adds these endpoints to your application:

### POST `/api/newsletter/subscribe`
Subscribe a new email address

```typescript
// Request
{
  "email": "user@example.com",
  "name": "John Doe", // optional
  "preferences": { // optional
    "newsletter": true,
    "announcements": false
  }
}

// Response
{
  "success": true,
  "subscriber": { /* subscriber object */ }
}
```

### POST `/api/newsletter/verify-magic-link`
Verify a magic link token

```typescript
// Request
{
  "token": "eyJhbGc..."
}

// Response
{
  "success": true,
  "subscriber": { /* subscriber object */ },
  "sessionToken": "eyJhbGc..."
}
```

### GET/POST `/api/newsletter/preferences`
Get or update subscriber preferences (requires magic link auth)

### POST `/api/newsletter/unsubscribe`
Unsubscribe an email address

## Newsletter Scheduling

If you enable newsletter scheduling, the plugin adds scheduling fields to your articles collection:

```typescript
features: {
  newsletterScheduling: {
    enabled: true,
    articlesCollection: 'articles', // Your existing collection
  }
}
```

This adds a "Newsletter Scheduling" group to your articles with:
- Schedule toggle
- Send date/time picker
- Audience segment selection
- Send status tracking

## Email Providers

### Resend

[Resend](https://resend.com) is a modern email API for developers.

```typescript
providers: {
  default: 'resend',
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    fromAddress: 'hello@yoursite.com',
    fromName: 'Your Newsletter',
    audienceIds: {
      en: {
        production: 'your_audience_id',
      },
    },
  },
}
```

### Broadcast

[Broadcast](https://github.com/socketry/broadcast) is a self-hosted email automation platform.

```typescript
providers: {
  default: 'broadcast',
  broadcast: {
    apiUrl: 'https://broadcast.yoursite.com',
    tokens: {
      production: process.env.BROADCAST_TOKEN,
      development: process.env.BROADCAST_DEV_TOKEN,
    },
    fromAddress: 'hello@yoursite.com',
    fromName: 'Your Newsletter',
  },
}
```

## TypeScript

The plugin is fully typed. Import types as needed:

```typescript
import type { 
  NewsletterPluginConfig,
  Subscriber,
  EmailProvider 
} from '@payloadcms/plugin-newsletter/types'
```

## Customization

### Custom Fields

Add custom fields to the subscribers collection:

```typescript
newsletterPlugin({
  fields: {
    additional: [
      {
        name: 'company',
        type: 'text',
        label: 'Company Name',
      },
      {
        name: 'role',
        type: 'select',
        options: ['developer', 'designer', 'manager'],
      },
    ],
  },
})
```

### Custom Email Templates

Override the default email templates:

```typescript
import { WelcomeEmail } from './emails/Welcome'

newsletterPlugin({
  templates: {
    welcome: WelcomeEmail,
  },
})
```

## Troubleshooting

### Common Issues

**"Already subscribed" error**
- The email already exists in the subscribers collection
- Check the admin panel to manage existing subscribers

**Magic links not working**
- Ensure `JWT_SECRET` is set in your environment variables
- Check that the `magicLinkPath` matches your frontend route

**Emails not sending**
- Verify your API keys are correct
- Check the email provider's dashboard for errors
- Ensure from address is verified with your provider

## Migration Guide

Coming from another newsletter system? The plugin stores subscribers in a standard Payload collection, making it easy to import existing data:

```typescript
// Example migration script
const existingSubscribers = await getFromOldSystem()

for (const subscriber of existingSubscribers) {
  await payload.create({
    collection: 'subscribers',
    data: {
      email: subscriber.email,
      name: subscriber.name,
      subscriptionStatus: 'active',
      // Map other fields as needed
    },
  })
}
```

## Contributing

We welcome contributions! Please see our [feedback and contribution guide](./FEEDBACK.md).

## License

MIT