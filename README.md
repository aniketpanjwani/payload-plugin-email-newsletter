# Payload Newsletter Plugin

[![npm version](https://img.shields.io/npm/v/payload-plugin-newsletter.svg?cache=300)](https://www.npmjs.com/package/payload-plugin-newsletter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A complete newsletter management plugin for [Payload CMS](https://github.com/payloadcms/payload) that provides subscriber management, magic link authentication, and email service integration out of the box.

> **Important**: Version 0.8.7+ includes critical fixes for Payload v3 compatibility. If you're using Payload v3, please ensure you're on at least version 0.8.7 of this plugin.

## Features

- 📧 **Complete Subscriber Management** - Ready-to-use subscriber collection with all essential fields
- 🔐 **Magic Link Authentication** - Passwordless authentication for subscribers (separate from Payload auth)
- 📨 **Email Service Integration** - Built-in support for Resend and Broadcast
- 📅 **Newsletter Scheduling** - Schedule newsletters from your articles collection
- ⚛️ **React Components** - Pre-built signup forms and preference management UI
- 🌍 **Internationalization** - Multi-language support built-in
- 📊 **Analytics Ready** - UTM tracking and signup metadata collection
- ⚙️ **Admin UI Configuration** - Manage email settings through Payload admin panel
- 🔄 **Bidirectional Sync** - Sync unsubscribes from email services back to Payload
- 👁️ **Email Preview** - Real-time preview with desktop/mobile views (v0.9.0+)
- ✅ **Email Validation** - Built-in validation for email client compatibility (v0.9.0+)
- 📝 **Email-Safe Editor** - Rich text editor limited to email-compatible features (v0.9.0+)
- 📬 **Broadcast Management** - Create and send email campaigns with provider sync (v0.10.0+)
- 🎨 **React Email Templates** - Customizable email templates with React Email (v0.12.0+)

## Prerequisites

- Payload CMS v3.0.0 or higher
- A Media collection configured in your Payload project (required for image support in broadcasts)

## Quick Start

### 1. Install the plugin

```bash
bun add payload-plugin-newsletter
# or
npm install payload-plugin-newsletter
# or
yarn add payload-plugin-newsletter
# or
pnpm add payload-plugin-newsletter
```

### 2. Add to your Payload config

```typescript
import { buildConfig } from 'payload/config'
import { newsletterPlugin } from 'payload-plugin-newsletter'

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
- A `newsletter-settings` collection for email configurations (supports multiple environments)
- API endpoints for subscription and authentication
- Newsletter scheduling fields to your articles (optional)

## Basic Usage

### Frontend Integration

#### Simple Newsletter Signup Form

```tsx
import { NewsletterForm } from 'payload-plugin-newsletter/components'

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

After setup, configure email settings at `/admin/collections/newsletter-settings` in your admin panel. You can:
- Create multiple configurations (e.g., for different environments or purposes)
- Set one configuration as active at a time
- Switch between email providers
- Update API keys and settings
- Customize email templates
- Set subscription preferences

**Note**: Only one configuration can be active at a time. The plugin will use the active configuration for sending emails.

## Initial Setup

After installing the plugin, you'll need to:

1. **Create an email configuration**:
   - Go to `/admin/collections/newsletter-settings`
   - Click "Create New"
   - Give it a name (e.g., "Production" or "Development")
   - Configure your email provider settings
   - Set it as "Active"
   - Save

2. **Start collecting subscribers**:
   - Subscribers will appear in `/admin/collections/subscribers`
   - Use the provided React components or API endpoints

## Email Preview Features (v0.9.0+)

The plugin includes comprehensive email preview functionality to ensure your newsletters look great across all email clients.

### Email-Safe Rich Text Editor

The plugin provides a pre-configured Lexical editor with only email-compatible features:

```typescript
import { createEmailContentField } from 'payload-plugin-newsletter/fields'

const BroadcastsCollection = {
  fields: [
    createEmailContentField({
      name: 'content',
      required: true,
    })
  ]
}
```

Features included:
- Basic text formatting (bold, italic, underline, strikethrough)
- Simple links
- Ordered and unordered lists
- Headings (H1, H2, H3)
- Text alignment
- Blockquotes

### Real-Time Email Preview

The plugin includes a preview component that shows how your email will look:

```typescript
{
  name: 'preview',
  type: 'ui',
  admin: {
    components: {
      Field: 'payload-plugin-newsletter/components/EmailPreviewField'
    }
  }
}
```

Preview features:
- **Desktop & Mobile Views** - Switch between viewport sizes
- **Live Updates** - See changes as you type
- **Validation Warnings** - Catch compatibility issues before sending
- **Test Email** - Send a test to your inbox

### Email HTML Validation

Built-in validation checks for:
- HTML size limits (Gmail's 102KB limit)
- Unsupported CSS properties
- Missing alt text on images
- External resources that won't load
- JavaScript that will be stripped

## Broadcast Management (v0.10.0+)

Create and send email campaigns directly from Payload:

### Enable Broadcasts

```typescript
newsletterPlugin({
  features: {
    newsletterManagement: {
      enabled: true,
    }
  },
  providers: {
    default: 'broadcast',
    broadcast: {
      apiUrl: process.env.BROADCAST_API_URL,
      token: process.env.BROADCAST_TOKEN,
      fromAddress: 'newsletter@yoursite.com',
      fromName: 'Your Newsletter',
    }
  }
})
```

This adds a `broadcasts` collection with:
- Rich text editor with email-safe formatting
- Image uploads with Media collection integration
- Custom email blocks (buttons, dividers)
- Inline email preview with React Email
- Automatic sync with your email provider

### Custom Email Templates (v0.12.0+)

Customize your email design with React Email templates:

```typescript
// email-templates/broadcast-template.tsx
import { Html, Body, Container, Text, Link } from '@react-email/components'

export default function BroadcastTemplate({ subject, preheader, content }) {
  return (
    <Html>
      <Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Text style={{ fontSize: '16px', lineHeight: '1.6' }}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </Text>
          <hr style={{ margin: '40px 0', border: '1px solid #e5e7eb' }} />
          <Text style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
            <Link href="{{unsubscribe_url}}" style={{ color: '#6b7280' }}>
              Unsubscribe
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

The plugin automatically detects templates at `email-templates/broadcast-template.tsx`.

### Utilities

Convert Lexical content to email-safe HTML:

```typescript
import { convertToEmailSafeHtml } from 'payload-plugin-newsletter/utils'

const html = await convertToEmailSafeHtml(editorState)
```

Validate any HTML for email compatibility:

```typescript
import { validateEmailHtml } from 'payload-plugin-newsletter/utils'

const result = validateEmailHtml(html)
if (!result.valid) {
  console.error('Email issues:', result.errors)
}
```

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
    
    // Broadcast management (v0.10.0+)
    newsletterManagement: {
      enabled: true, // Enables broadcasts collection
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

### POST `/api/newsletter/signin`
Request a magic link for existing subscribers

```typescript
// Request
{
  "email": "user@example.com"
}

// Response
{
  "success": true,
  "message": "Check your email for the sign-in link"
}
```

### GET `/api/newsletter/me`
Get current authenticated subscriber (requires authentication)

```typescript
// Response
{
  "success": true,
  "subscriber": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "status": "active",
    "preferences": { /* preferences */ }
  }
}
```

### POST `/api/newsletter/signout`
Sign out the current subscriber

```typescript
// Response
{
  "success": true,
  "message": "Signed out successfully"
}
```

## Authentication

The plugin provides complete magic link authentication for subscribers:

### Client-Side Authentication

Use the `useNewsletterAuth` hook in your React components:

```tsx
import { useNewsletterAuth } from 'payload-plugin-newsletter/client'

function MyComponent() {
  const { 
    subscriber, 
    isAuthenticated, 
    isLoading, 
    signOut, 
    refreshAuth 
  } = useNewsletterAuth()
  
  if (isLoading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <div>Please sign in to manage your preferences</div>
  }
  
  return (
    <div>
      <p>Welcome {subscriber.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Server-Side Authentication

For Next.js applications, use the session utilities:

```typescript
import { requireAuth, getServerSideAuth } from 'payload-plugin-newsletter'

// Protect a page - redirects to /auth/signin if not authenticated
export const getServerSideProps = requireAuth()

// Or with custom logic
export const getServerSideProps = requireAuth(async (context) => {
  // Your custom logic here
  const data = await fetchData()
  return { props: { data } }
})

// Manual authentication check
export const getServerSideProps = async (context) => {
  const { subscriber, isAuthenticated } = await getServerSideAuth(context)
  
  if (!isAuthenticated) {
    // Handle unauthenticated state
  }
  
  return {
    props: { subscriber }
  }
}
```

### Authentication Flow

1. **Subscribe**: New users receive a magic link email to verify their email
2. **Sign In**: Existing subscribers can request a new magic link via `/api/newsletter/signin`
3. **Verify**: Clicking the magic link verifies the email and creates a session
4. **Session**: Sessions are stored in httpOnly cookies (30-day expiry by default)
5. **Sign Out**: Clears the session cookie

### Configuration

```typescript
newsletterPlugin({
  auth: {
    enabled: true, // Enable/disable authentication
    tokenExpiration: '7d', // Magic link validity
    magicLinkPath: '/newsletter/verify', // Verification redirect path
  },
  // Email templates can be customized
  emails: {
    magicLink: {
      subject: 'Sign in to {{siteName}}',
    },
    welcome: {
      enabled: true,
      subject: 'Welcome to {{siteName}}!',
    },
    signIn: {
      subject: 'Sign in to your account',
    },
  },
})
```

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

## Unsubscribe Sync

The plugin supports bidirectional synchronization of unsubscribe states between Payload and your email service:

```typescript
features: {
  unsubscribeSync: {
    enabled: true,
    schedule: '0 * * * *', // Hourly sync
    queue: 'newsletter-sync' // Optional custom queue name
  }
}
```

This feature:
- Polls your email service for unsubscribed users
- Updates their status in Payload automatically
- Supports both Broadcast and Resend providers
- Can run on a schedule or be triggered manually

For more details, see the [Unsubscribe Sync documentation](./docs/unsubscribe-sync.md).

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

[Broadcast](https://sendbroadcast.net/) is a self-hosted email automation platform.

```typescript
providers: {
  default: 'broadcast',
  broadcast: {
    apiUrl: process.env.BROADCAST_API_URL,
    token: process.env.BROADCAST_TOKEN,
    // Optional: These can be set here as defaults or configured in the admin UI
    fromAddress: 'hello@yoursite.com',
    fromName: 'Your Newsletter',
    replyTo: 'replies@yoursite.com',
  },
}
```

**Note**: Settings configured in the Payload admin UI take precedence over these config values. The config values serve as defaults when settings haven't been configured yet.

## TypeScript

The plugin is fully typed. Import types as needed:

```typescript
import type { 
  NewsletterPluginConfig,
  Subscriber,
  EmailProvider 
} from 'payload-plugin-newsletter/types'
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

## Security

### Access Control

The plugin implements proper access control for all operations:

- **Subscriber data**: Users can only access and modify their own data via magic link authentication
- **Newsletter settings**: Only admin users can modify email provider settings and configurations
- **API endpoints**: All endpoints respect Payload's access control rules

#### Custom Admin Check

The plugin supports multiple admin authentication patterns out of the box:
- `user.roles.includes('admin')` - Role-based
- `user.isAdmin === true` - Boolean field
- `user.role === 'admin'` - Single role field
- `user.admin === true` - Admin boolean

If your setup uses a different pattern, configure a custom admin check:

```typescript
newsletterPlugin({
  access: {
    isAdmin: (user) => {
      // Your custom logic
      return user.customAdminField === true
    }
  },
  // ... other config
})
```

### Best Practices

- Always use environment variables for sensitive data (API keys, JWT secrets)
- Enable double opt-in for GDPR compliance
- Configure allowed domains to prevent spam subscriptions
- Set reasonable rate limits for subscriptions per IP

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

### Release Process

This project uses a developer-controlled release process:
- **Version bumps happen locally** - You control when and what type
- **CI/CD publishes automatically** - When it detects a version change
- **No bot commits** - Your local repo stays in sync

See [Release Documentation](./docs/RELEASE.md) for details.

## License

MIT