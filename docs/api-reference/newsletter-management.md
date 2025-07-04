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
  "name": "Holiday Sale",
  "subject": "Get 50% off this weekend!",
  "content": "<h1>Holiday Sale</h1><p>...</p>",
  "trackOpens": true,
  "trackClicks": true
}
```
Creates a new broadcast. The collection hooks automatically sync with your email provider (Broadcast or Resend).

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

- **beforeChange**: Creates/updates the broadcast in the provider
- **afterChange**: Updates local status after provider operations
- **beforeDelete**: Removes the broadcast from the provider

This ensures your Payload data and provider data stay in sync.

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