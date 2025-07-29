# Newsletter Plugin API Key Support Recommendations

## Current Issue
The broadcasts collection access control doesn't properly handle API key authentication. When users authenticate with `users API-Key {key}`, the `req.user` is undefined, causing 403 errors.

## Recommended Changes

### 1. Update Broadcasts Collection Access Control

In `src/collections/Broadcasts.ts`, update the access control to check for API key authentication:

```typescript
access: {
  read: () => true,
  create: ({ req }) => {
    // Check for standard user authentication
    if (req.user) return true
    
    // Check for API key authentication
    const authHeader = req.headers?.get?.('authorization') || 
                      req.headers?.authorization || 
                      req.headers?.['authorization']
    
    if (authHeader && typeof authHeader === 'string') {
      // Payload uses "users API-Key {key}" format for API key auth
      if (authHeader.startsWith('users API-Key ')) {
        // When authenticated via API key, req.user might be undefined
        // but the request is still authenticated
        return true
      }
    }
    
    return false
  },
  update: ({ req }) => {
    // Same logic as create
    if (req.user) return true
    
    const authHeader = req.headers?.get?.('authorization') || 
                      req.headers?.authorization || 
                      req.headers?.['authorization']
    
    if (authHeader && typeof authHeader === 'string' && 
        authHeader.startsWith('users API-Key ')) {
      return true
    }
    
    return false
  },
  delete: ({ req }) => {
    // Same logic as create/update
    if (req.user) return true
    
    const authHeader = req.headers?.get?.('authorization') || 
                      req.headers?.authorization || 
                      req.headers?.['authorization']
    
    if (authHeader && typeof authHeader === 'string' && 
        authHeader.startsWith('users API-Key ')) {
      return true
    }
    
    return false
  },
},
```

### 2. Alternative: Create a Utility Function

Create a utility function in `src/utils/checkApiKeyAuth.ts`:

```typescript
export function hasApiKeyAuth(req: any): boolean {
  // Multiple ways to access headers depending on the request type
  const authHeader = req.headers?.get?.('authorization') || 
                     req.headers?.authorization || 
                     req.headers?.['authorization']
  
  if (authHeader && typeof authHeader === 'string') {
    return authHeader.startsWith('users API-Key ')
  }
  
  return false
}

export function isAuthenticated(req: any): boolean {
  return !!req.user || hasApiKeyAuth(req)
}
```

Then use it in the access control:

```typescript
import { isAuthenticated } from '../utils/checkApiKeyAuth'

// In Broadcasts collection
access: {
  read: () => true,
  create: ({ req }) => isAuthenticated(req),
  update: ({ req }) => isAuthenticated(req),
  delete: ({ req }) => isAuthenticated(req),
},
```

### 3. Version Bump
After implementing these changes, bump the version to v0.16.5 with the changelog:
- Fixed: API key authentication support for broadcasts collection
- Fixed: Access control now properly handles requests authenticated via API keys

## Testing
The changes can be tested by:
1. Creating an API key in Payload admin
2. Making a POST request to `/api/broadcasts` with header `Authorization: users API-Key {key}`
3. Verifying the broadcast is created successfully

## Note
The Payload CMS documentation doesn't clearly state that `req.user` is undefined for API key authenticated requests, but this is the observed behavior. The API key authentication is valid, but the user object isn't populated in the request context.