# Email Provider Guide

This guide covers how to configure and use different email providers with the Payload Newsletter Plugin.

## Choosing a Provider

You have two main options:

1. **Managed Services** (Resend) - More expensive but no infrastructure setup required
2. **Self-Hosted** (Broadcast) - Very cost-effective (license fee + VPS + SES costs) but requires infrastructure setup

## Supported Providers

### Resend

Resend is a modern email API designed for developers with managed infrastructure.

```typescript
newsletterPlugin({
  emailProvider: {
    provider: 'resend',
    config: {
      apiKey: process.env.RESEND_API_KEY!,
      fromAddress: 'newsletter@example.com',
      fromName: 'My Newsletter',
      replyTo: 'support@example.com', // Optional
      // Optional: Audience management
      audienceIds: {
        en: 'audience_id_english',
        es: 'audience_id_spanish'
      }
    }
  }
})
```

#### Features
- ✅ Transactional emails
- ✅ Bulk sending
- ✅ Contact management
- ✅ Email templates
- ✅ Detailed analytics

#### Setup
1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key
4. Add to your environment variables

### Broadcast

Broadcast is a self-hosted newsletter platform designed specifically for newsletters and content creators. It requires infrastructure setup but offers significant cost savings.

```typescript
newsletterPlugin({
  emailProvider: {
    provider: 'broadcast',
    config: {
      apiToken: process.env.BROADCAST_TOKEN!,
      fromAddress: 'newsletter@example.com',
      fromName: 'My Newsletter'
    }
  }
})
```

#### Features
- ✅ Newsletter-focused
- ✅ Subscriber segments
- ✅ Email sequences
- ✅ Built-in unsubscribe handling
- ✅ Content creator tools
- ✅ Self-hosted (full control)
- ✅ Cost-effective at scale

#### Setup
1. Purchase license at [sendbroadcast.net](https://sendbroadcast.net)
2. Set up on your VPS/server
3. Configure with your email provider (e.g., AWS SES)
4. Create an access token
5. Configure channel settings
6. Add to your environment variables

#### Cost Structure
- One-time license fee
- VPS hosting costs (~$5-20/month)
- Email provider costs (e.g., AWS SES ~$0.10 per 1000 emails)

### Custom Provider

You can implement your own email provider:

```typescript
import type { EmailProvider } from 'payload-plugin-newsletter/types'

class CustomProvider implements EmailProvider {
  async send(data: EmailData): Promise<void> {
    // Your implementation
  }

  async sendBulk(data: BulkEmailData): Promise<void> {
    // Your implementation
  }

  getProvider(): string {
    return 'custom'
  }

  // Optional methods
  async addContact(subscriber: Subscriber): Promise<void> {}
  async updateContact(subscriber: Subscriber): Promise<void> {}
  async removeContact(subscriber: Subscriber): Promise<void> {}
}

// Use in config
newsletterPlugin({
  emailProvider: {
    provider: 'custom',
    instance: new CustomProvider()
  }
})
```

## Provider Comparison

| Feature | Resend | Broadcast | Custom |
|---------|---------|-----------|---------|
| Hosting | Managed | Self-hosted | Depends |
| Setup Complexity | Easy | Moderate | Varies |
| Cost Structure | Per email | License + Infrastructure | Varies |
| Transactional Emails | ✅ | ✅ | Depends |
| Bulk Sending | ✅ | ✅ | Depends |
| Contact Management | ✅ | ✅ | Optional |
| Templates | ✅ | ✅ | Optional |
| Sequences | ❌ | ✅ | Optional |
| Analytics | ✅ | ✅ | Optional |
| Webhooks | ✅ | ✅ | Optional |
| Best For | Quick setup, smaller lists | Cost-conscious, larger lists | Specific needs |

## Configuration Options

### Common Options

All providers support these base options:

```typescript
{
  fromAddress: string      // Sender email address
  fromName: string        // Sender display name
  replyTo?: string       // Reply-to address
  isDevelopment?: boolean // Development mode flag
}
```

### Provider-Specific Options

#### Resend
```typescript
{
  apiKey: string                    // Resend API key
  audienceIds?: Record<string, string> // Locale to audience ID mapping
  tags?: string[]                   // Default tags for contacts
}
```

#### Broadcast
```typescript
{
  apiToken: string    // Broadcast API token
  channelId?: string  // Specific channel ID
  baseUrl?: string    // Custom API endpoint
}
```

## Email Templates

### Using React Email

The plugin supports React Email templates:

```typescript
import { Button, Html, Text } from '@react-email/components'

export const WelcomeEmail = ({ name }: { name: string }) => (
  <Html>
    <Text>Welcome {name}!</Text>
    <Button href="https://example.com">
      Get Started
    </Button>
  </Html>
)
```

### Provider Templates

Some providers support their own template systems:

```typescript
// Resend with template ID
await emailService.send({
  to: subscriber.email,
  templateId: 'welcome_email',
  data: { name: subscriber.name }
})
```

## Error Handling

All providers should handle errors gracefully:

```typescript
try {
  await emailService.send(emailData)
} catch (error) {
  if (error.code === 'rate_limit') {
    // Handle rate limiting
  } else if (error.code === 'invalid_email') {
    // Handle invalid email
  } else {
    // Generic error handling
  }
}
```

## Testing

### Development Mode

In development, emails can be logged instead of sent:

```typescript
newsletterPlugin({
  emailProvider: {
    provider: 'resend',
    config: {
      apiKey: process.env.RESEND_API_KEY!,
      fromAddress: 'test@example.com',
      fromName: 'Test Newsletter',
      isDevelopment: process.env.NODE_ENV === 'development'
    }
  }
})
```

### Test Credentials

Use test API keys when available:

```bash
# Resend test key
RESEND_API_KEY=re_test_...

# Broadcast test mode
BROADCAST_TEST_MODE=true
```

## Best Practices

1. **Always verify domains** before sending
2. **Handle rate limits** with exponential backoff
3. **Log all email operations** for debugging
4. **Use templates** for consistent formatting
5. **Test with small batches** before bulk sending
6. **Monitor bounce rates** and handle appropriately
7. **Implement unsubscribe** in all emails
8. **Use double opt-in** for new subscribers

## Switching Providers

The plugin makes it easy to switch providers:

1. Update your configuration
2. Update environment variables
3. Test with a small batch
4. Monitor for any issues

Data migration is handled automatically for subscriber records.