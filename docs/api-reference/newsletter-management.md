# Broadcast Management API

The broadcast management feature integrates with Payload's automatic REST API to provide full CRUD operations on broadcasts (individual email campaigns), plus custom actions for sending and scheduling.

**Note**: API endpoints use `/newsletters` for backwards compatibility but manage broadcasts.

## Collection Endpoints (Automatic)

When broadcast management is enabled, Payload automatically creates these REST endpoints for the `newsletters` collection (or your custom collection slug):

### List Broadcasts
```
GET /api/newsletters
```
Returns paginated list of broadcasts with standard Payload query parameters:
- `?where[status][equals]=draft` - Filter by status
- `?sort=-createdAt` - Sort by creation date
- `?limit=10&page=2` - Pagination

### Get Broadcast
```
GET /api/newsletters/:id
```
Returns a single broadcast by ID.

### Create Broadcast
```
POST /api/newsletters
Content-Type: application/json

{
  "subject": "Get 50% off this weekend!",
  "preheader": "Limited time offer inside",
  "content": {
    "root": {
      "type": "root",
      "children": [...]
    }
  },
  "settings": {
    "trackOpens": true,
    "trackClicks": true
  }
}
```
Creates a new broadcast. The collection hooks automatically sync with your email provider (Broadcast or Resend).

**Note**: The `content` field expects Lexical editor state format. The broadcast uses `subject` as its title (the separate `name` field was removed in v0.11.0).

### Update Broadcast
```
PATCH /api/newsletters/:id
Content-Type: application/json

{
  "subject": "Updated: Get 60% off this weekend!"
}
```
Updates an existing broadcast. The collection hooks sync changes with the provider.

### Delete Broadcast
```
DELETE /api/newsletters/:id
```
Deletes a broadcast. The collection hooks remove it from the provider.

## Custom Action Endpoints

The plugin adds these custom endpoints for broadcast-specific actions:

### Send Broadcast
```
POST /api/newsletters/:id/send
Content-Type: application/json

{
  "testMode": false,
  "audienceIds": ["audience-123"]
}
```
Immediately sends the broadcast to subscribers.

### Schedule Broadcast
```
POST /api/newsletters/:id/schedule
Content-Type: application/json

{
  "scheduledAt": "2024-12-25T10:00:00Z"
}
```
Schedules the broadcast to be sent at a future date/time.

## Authentication

All broadcast endpoints require admin authentication. Include your Payload auth token:
```
Authorization: Bearer YOUR_AUTH_TOKEN
```

## Provider Synchronization

The newsletter collection uses hooks to keep data synchronized with your email provider:

### Create Sync (afterChange hook)
When creating a new broadcast:
1. The broadcast is saved locally in Payload
2. The hook creates it in the provider (using `subject` as the name)
3. The provider's ID is stored in `providerId` field
4. Any provider-specific data is stored in `providerData`

### Update Sync (beforeChange hook)
When updating an existing broadcast:
1. The hook checks if the broadcast is still editable (draft status)
2. Changed fields are synced to the provider
3. The `subject` field is used as both name and subject in the provider

### Delete Sync (afterDelete hook)
When deleting a broadcast:
1. The hook checks if the broadcast can be deleted (draft/canceled status)
2. The broadcast is removed from the provider
3. Local deletion proceeds

**Note**: Sync only works for broadcasts in editable statuses. Once sent, broadcasts become read-only.

## Email Preview

The broadcast editor includes an inline email preview feature (v0.12.0+):

- **Location**: Below the content editor in the broadcast edit view
- **Update**: Click "Show Preview" then "Update Preview" to refresh
- **Views**: Toggle between desktop (600px) and mobile (375px) views
- **Template**: Uses React Email with a default template or custom template

### Custom Email Templates

Create a custom template at `email-templates/broadcast-template.tsx`:

```typescript
import { Html, Body, Container, Text, Link } from '@react-email/components'

export default function BroadcastTemplate({ subject, preheader, content }) {
  return (
    <Html>
      <Body>
        <Container>
          <div dangerouslySetInnerHTML={{ __html: content }} />
          <Link href="{{unsubscribe_url}}">Unsubscribe</Link>
        </Container>
      </Body>
    </Html>
  )
}
```

The template receives:
- `subject`: The email subject line
- `preheader`: Preview text (optional)
- `content`: Email-safe HTML content

## Status Values

Broadcasts can have these status values:
- `draft` - Being edited, not sent
- `scheduled` - Scheduled for future sending
- `sending` - Currently being sent
- `sent` - Successfully sent
- `failed` - Send attempt failed
- `paused` - Sending paused
- `canceled` - Scheduled send was canceled

## Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (validation errors)
- `401` - Unauthorized
- `404` - Broadcast not found
- `501` - Not supported by provider

Provider-specific errors include an error code:
```json
{
  "success": false,
  "error": "Feature not supported by Resend",
  "code": "NOT_SUPPORTED"
}
```

## Provider Limitations

### Broadcast
- Full CRUD support
- Scheduling supported
- Analytics available

### Resend
- Limited API documentation
- Some operations may return NOT_SUPPORTED
- Check provider capabilities before using features