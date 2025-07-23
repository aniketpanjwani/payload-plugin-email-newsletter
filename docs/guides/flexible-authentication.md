# Flexible Authentication Guide

Starting from version 0.14.0, the newsletter plugin provides flexible authentication options to handle different subscriber states.

## Configuration Options

### Allow Unsubscribed Sign-in

By default, only active subscribers can sign in. To allow unsubscribed users to sign in (e.g., to manage preferences or resubscribe):

```typescript
newsletterPlugin({
  auth: {
    allowUnsubscribedSignin: true,
  }
})
```

### Allow Resubscription

By default, unsubscribed users cannot resubscribe through the API. To allow them to resubscribe:

```typescript
newsletterPlugin({
  auth: {
    allowResubscribe: true,
  }
})
```

## Behavior Changes

### Sign-in Flow

With `allowUnsubscribedSignin: true`:
- Unsubscribed users can sign in to access their account
- They remain unsubscribed until explicitly resubscribing
- Useful for preference management or account deletion

### Subscribe Flow

With `allowResubscribe: true`:
- Unsubscribed users can resubscribe through the subscribe form
- They receive a "Welcome back" email
- Their subscription status is updated to "active"
- Already subscribed users receive a sign-in link instead of an error

## Response Formats

### Sign-in Endpoint

```typescript
// Success
{
  success: true,
  message: "Check your email for the sign-in link"
}

// Unsubscribed user (when not allowed)
{
  success: false,
  error: "Your subscription is inactive. Please resubscribe to sign in.",
  subscriber: {
    id: "...",
    email: "user@example.com",
    subscriptionStatus: "unsubscribed"
  },
  requiresResubscribe: true
}
```

### Subscribe Endpoint

```typescript
// Resubscribed user
{
  success: true,
  message: "Welcome back! You have been resubscribed.",
  subscriber: {
    id: "...",
    email: "user@example.com",
    subscriptionStatus: "active"
  },
  wasResubscribed: true
}

// Already subscribed
{
  success: true,
  message: "You are already subscribed! Check your email for a sign-in link.",
  alreadySubscribed: true
}
```

## Frontend Integration

Use the response fields to show appropriate UI:

```typescript
const handleSubscribe = async (email: string) => {
  const response = await fetch('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
  
  const data = await response.json()
  
  if (data.alreadySubscribed) {
    // Show "Already subscribed, check email for sign-in link"
    showInfo(data.message)
  } else if (data.wasResubscribed) {
    // Show "Welcome back!"
    showSuccess(data.message)
  } else {
    // New subscriber
    showSuccess("Thanks for subscribing!")
  }
}
```

## Migration Guide

Existing installations will maintain current behavior (restrictive). To enable the new flexible behavior:

1. Update to version 0.14.0 or later
2. Add the configuration options to your payload config
3. Update your frontend to handle the new response fields