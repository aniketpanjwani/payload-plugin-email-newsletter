# Improved Authentication Flow Design

## Current Issues

1. **signin endpoint** - Only allows active subscribers to sign in (line 51)
2. **subscribe endpoint** - Blocks unsubscribed users from resubscribing (line 75-80)
3. **No flexibility** - Apps can't customize behavior for their use cases

## Proposed Design

### 1. Add Configuration Options

```typescript
export interface NewsletterPluginConfig {
  // ... existing config ...
  
  auth?: {
    // ... existing auth config ...
    
    /**
     * Allow unsubscribed users to sign in
     * @default false
     */
    allowUnsubscribedSignin?: boolean
    
    /**
     * Allow unsubscribed users to resubscribe
     * @default false
     */
    allowResubscribe?: boolean
    
    /**
     * Custom signin behavior
     */
    signinBehavior?: 'strict' | 'permissive' | 'custom'
    
    /**
     * Custom handler for signin attempts
     */
    onSigninAttempt?: (args: {
      subscriber: Subscriber | null
      email: string
      req: PayloadRequest
    }) => {
      allow: boolean
      message?: string
      resubscribe?: boolean
    } | Promise<{
      allow: boolean
      message?: string
      resubscribe?: boolean
    }>
  }
}
```

### 2. Update Endpoints to Return Status Information

**signin endpoint response:**
```typescript
{
  success: boolean
  message: string
  subscriber?: {
    id: string
    email: string
    subscriptionStatus: 'active' | 'unsubscribed' | 'pending'
    name?: string
  }
  requiresResubscribe?: boolean
}
```

**subscribe endpoint response:**
```typescript
{
  success: boolean
  message: string
  subscriber?: {
    id: string
    email: string
    subscriptionStatus: string
  }
  wasResubscribed?: boolean
  alreadySubscribed?: boolean
}
```

### 3. Implementation Changes

#### signin.ts improvements:
```typescript
// Find subscriber (including unsubscribed)
const result = await req.payload.find({
  collection: config.subscribersSlug || 'subscribers',
  where: {
    email: { equals: email.toLowerCase() },
    // Remove the subscriptionStatus filter
  },
  limit: 1,
  overrideAccess: true,
})

const subscriber = result.docs[0]

// Handle different cases
if (!subscriber) {
  return Response.json({
    success: false,
    error: 'Email not found. Please subscribe first.',
    requiresSubscribe: true,
  }, { status: 404 })
}

// Check if custom handler exists
if (config.auth?.onSigninAttempt) {
  const decision = await config.auth.onSigninAttempt({
    subscriber,
    email,
    req,
  })
  
  if (!decision.allow) {
    return Response.json({
      success: false,
      error: decision.message || 'Sign in not allowed',
    }, { status: 403 })
  }
}

// Default behavior based on config
const allowUnsubscribed = config.auth?.allowUnsubscribedSignin ?? false

if (subscriber.subscriptionStatus === 'unsubscribed' && !allowUnsubscribed) {
  return Response.json({
    success: false,
    error: 'Your subscription is inactive. Please resubscribe to sign in.',
    subscriber: {
      id: subscriber.id,
      email: subscriber.email,
      subscriptionStatus: subscriber.subscriptionStatus,
    },
    requiresResubscribe: true,
  }, { status: 403 })
}

// Generate and send magic link...
```

#### subscribe.ts improvements:
```typescript
if (existing.docs.length > 0) {
  const subscriber = existing.docs[0]
  
  // Handle unsubscribed users
  if (subscriber.subscriptionStatus === 'unsubscribed') {
    const allowResubscribe = config.auth?.allowResubscribe ?? false
    
    if (!allowResubscribe) {
      return Response.json({
        success: false,
        error: 'This email has been unsubscribed. Please contact support to resubscribe.',
      }, { status: 400 })
    }
    
    // Resubscribe the user
    const updated = await req.payload.update({
      collection: config.subscribersSlug || 'subscribers',
      id: subscriber.id,
      data: {
        subscriptionStatus: 'active',
        resubscribedAt: new Date().toISOString(),
        // Preserve preferences but update metadata
        signupMetadata: {
          ...metadata,
          source: source || 'resubscribe',
          resubscribedFrom: subscriber.signupMetadata?.source,
        },
      },
      overrideAccess: true,
    })
    
    // Send welcome back email
    // ... email logic ...
    
    return Response.json({
      success: true,
      message: 'Welcome back! You have been resubscribed.',
      subscriber: {
        id: updated.id,
        email: updated.email,
        subscriptionStatus: updated.subscriptionStatus,
      },
      wasResubscribed: true,
    })
  }
  
  // Already active subscriber - could be trying to sign in
  if (subscriber.subscriptionStatus === 'active') {
    // Generate magic link for signin
    const token = generateMagicLinkToken(
      String(subscriber.id),
      subscriber.email,
      config
    )
    
    // Send signin email instead of error
    // ... email logic ...
    
    return Response.json({
      success: true,
      message: 'You are already subscribed! Check your email for a sign-in link.',
      alreadySubscribed: true,
    })
  }
}
```

### 4. Usage Examples

**Basic usage with defaults:**
```typescript
newsletterPlugin({
  // Current behavior maintained
})
```

**Allow unsubscribed users to sign in:**
```typescript
newsletterPlugin({
  auth: {
    allowUnsubscribedSignin: true,
    allowResubscribe: true,
  }
})
```

**Custom logic:**
```typescript
newsletterPlugin({
  auth: {
    onSigninAttempt: async ({ subscriber, email }) => {
      // Custom business logic
      if (subscriber?.subscriptionStatus === 'unsubscribed') {
        // Check how long they've been unsubscribed
        const unsubscribedAt = new Date(subscriber.unsubscribedAt)
        const daysSinceUnsubscribe = (Date.now() - unsubscribedAt.getTime()) / (1000 * 60 * 60 * 24)
        
        if (daysSinceUnsubscribe < 30) {
          return {
            allow: true,
            message: 'Welcome back!',
          }
        } else {
          return {
            allow: false,
            message: 'Please resubscribe to continue',
            resubscribe: true,
          }
        }
      }
      
      return { allow: true }
    }
  }
})
```

## Benefits

1. **Backward compatible** - Existing apps continue to work
2. **Flexible** - Apps can customize behavior
3. **Clear communication** - Status information helps apps show appropriate UI
4. **Secure by default** - Restrictive defaults, opt-in to permissive behavior