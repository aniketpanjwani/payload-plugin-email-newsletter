# Broadcast API Authentication

## Creating an Access Token

Broadcast creates a default Access Token during installation (for transactional emails). You can create additional tokens with specific permissions.

### Permission Scopes

- **Broadcasts (Read):** List and read broadcasts
- **Broadcasts (Write):** Send and update broadcasts
- **Transactional (Read):** List and read transactional emails
- **Transactional (Write):** Send transactional emails
- **Subscribers (Read):** List and read subscribers
- **Subscribers (Write):** Create and update subscribers
- **Sequences (Read):** List and read subscribers in sequences
- **Sequences (Write):** Add or remove subscribers from sequences

**Best practice:** Create tokens with minimum required permissions.

## Using an Access Token

Include the token in the `Authorization` header:

```
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

### Example cURL Request

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  https://your-broadcast-instance.com/api/v1/broadcasts
```

### Example in TypeScript

```typescript
const response = await fetch(`${baseUrl}/api/v1/broadcasts`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## Error Responses

**401 Unauthorized:**
- Token is invalid, expired, or revoked
- Token lacks permission for the requested operation
- Missing `Bearer ` prefix

## Managing Tokens

Access tokens in the Broadcast dashboard:
1. Click **Access Tokens** in left sidebar
2. View, create, or refresh tokens

### Refreshing Tokens

- Tokens don't expire by default
- Refreshing creates a new value, invalidating the old one immediately
- Update all integrations with the new token value

**Warning:** Old token stops working immediately after refresh.
