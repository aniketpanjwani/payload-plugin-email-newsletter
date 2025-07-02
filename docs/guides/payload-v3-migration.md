# Payload v3 Migration Guide

This guide helps you migrate the Newsletter Plugin to work with Payload v3, or troubleshoot common issues.

## Breaking Changes in Payload v3

Payload v3 introduced significant changes to the REST API endpoint handlers that affect how plugins work:

### 1. Request Body Access

**Payload v2:**
```typescript
handler: async (req, res) => {
  const { email } = req.data // ❌ No longer works in v3
}
```

**Payload v3:**
```typescript
handler: async (req) => {
  const data = await req.json() // ✅ Correct v3 pattern
  const { email } = data
}
```

### 2. Response Format

**Payload v2:**
```typescript
handler: async (req, res) => {
  res.status(200).json({ success: true }) // ❌ No res object in v3
}
```

**Payload v3:**
```typescript
handler: async (req) => {
  return Response.json({ success: true }, { status: 200 }) // ✅ Correct v3 pattern
}
```

### 3. Cookie Access

**Payload v2:**
```typescript
handler: async (req, res) => {
  const token = req.cookies['auth-token'] // ❌ No req.cookies in v3
}
```

**Payload v3:**
```typescript
handler: async (req) => {
  const cookieHeader = req.headers.get('cookie') || ''
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...value] = c.split('=')
      return [key, value.join('=')]
    })
  )
  const token = cookies['auth-token'] // ✅ Parse from headers
}
```

## Common Errors and Solutions

### Error: "Cannot destructure property 'email' of 'req.data' as it is undefined"

**Cause**: The plugin is trying to access `req.data` which doesn't exist in Payload v3.

**Solution**: Upgrade to plugin version 0.8.7 or higher:
```bash
npm install payload-plugin-newsletter@latest
```

### Error: "Cannot read properties of undefined (reading 'newsletter-auth')"

**Cause**: The plugin is trying to access `req.cookies` which doesn't exist in Payload v3.

**Solution**: Upgrade to plugin version 0.8.7 or higher which properly parses cookies from headers.

### Error: "res.status is not a function"

**Cause**: Payload v3 endpoints only receive a `req` parameter, not `(req, res)`.

**Solution**: Upgrade to plugin version 0.8.7 or higher which uses the correct response pattern.

## Migration Checklist

If you're upgrading from an older version of the plugin:

1. **Update the plugin**:
   ```bash
   npm install payload-plugin-newsletter@latest
   ```

2. **Clear your cache**:
   ```bash
   rm -rf node_modules/.cache
   rm -rf .next
   ```

3. **Restart your development server**

4. **Test all endpoints**:
   - Subscribe: `POST /api/newsletter/subscribe`
   - Sign in: `POST /api/newsletter/signin`
   - Verify magic link: `POST /api/newsletter/verify-magic-link`
   - Get preferences: `GET /api/newsletter/preferences`
   - Update preferences: `POST /api/newsletter/preferences`
   - Unsubscribe: `POST /api/newsletter/unsubscribe`

## Custom Endpoint Patterns

If you're building custom endpoints for Payload v3, follow these patterns:

### Basic Endpoint
```typescript
export const myEndpoint = {
  path: '/my-endpoint',
  method: 'post',
  handler: async (req) => {
    // Parse request body
    const data = await req.json()
    
    // Access Payload
    const { payload } = req
    
    // Do your logic
    const result = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: data.email } }
    })
    
    // Return response
    return Response.json({
      success: true,
      data: result
    }, { status: 200 })
  }
}
```

### With Authentication
```typescript
export const protectedEndpoint = {
  path: '/protected',
  method: 'get',
  handler: async (req) => {
    // Parse auth token from headers
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Verify token and continue...
    return Response.json({ success: true })
  }
}
```

### With Cookies
```typescript
export const cookieEndpoint = {
  path: '/with-cookies',
  method: 'get',
  handler: async (req) => {
    // Parse cookies
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...value] = c.split('=')
        return [key, value.join('=')]
      })
    )
    
    const sessionToken = cookies['session']
    
    // Set cookies in response
    const response = Response.json({ success: true })
    response.headers.set(
      'Set-Cookie',
      'session=new-value; Path=/; HttpOnly; SameSite=Strict'
    )
    
    return response
  }
}
```

## Need Help?

If you're still experiencing issues after upgrading:

1. Check you're on the latest version: `npm list payload-plugin-newsletter`
2. Clear all caches and rebuild
3. Check the [GitHub issues](https://github.com/aniketpanjwani/payload-plugin-email-newsletter/issues)
4. Open a new issue with:
   - Your Payload version
   - Your plugin version
   - The exact error message
   - Your configuration