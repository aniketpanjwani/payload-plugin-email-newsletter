# Broadcasts API

Full CRUD operations for managing email broadcast campaigns.

## Required Permissions

- **Read:** GET endpoints (list, show, statistics)
- **Write:** POST, PATCH, DELETE endpoints and send operations

## Broadcast Object

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `subject` | Email subject line |
| `preheader` | Preview text in email clients |
| `body` | Email content (HTML) |
| `name` | Internal name |
| `track_opens` | Open tracking enabled |
| `track_clicks` | Click tracking enabled |
| `status` | Current status |
| `html_body` | Whether body is HTML |
| `reply_to` | Reply-to email address |
| `total_recipients` | Total recipients count |
| `sent_at` | When broadcast was sent |
| `scheduled_send_at` | Scheduled send time |

## Status Values

- `draft` - Being composed, can be edited
- `scheduled` - Scheduled for future, can be edited
- `queueing` - Being prepared for sending
- `sending` - Currently sending
- `sent` - Successfully sent
- `failed` - Failed to send
- `partial_failure` - Some recipients failed
- `aborted` - Manually stopped
- `paused` - Temporarily paused

## Endpoints

### List Broadcasts

```
GET /api/v1/broadcasts
```

**Query Parameters:**
- `limit` - Maximum results
- `offset` - Pagination offset

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Weekly Newsletter",
      "subject": "Your Weekly Update",
      "status": "draft",
      "total_recipients": 0,
      "sent_at": null,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 1
}
```

### Get Broadcast

```
GET /api/v1/broadcasts/:id
```

### Create Broadcast

```
POST /api/v1/broadcasts
```

**Parameters:**
- `subject` (required) - Subject line
- `body` (required) - HTML content
- `name` - Internal name
- `preheader` - Preview text
- `html_body` - Is HTML (default: false)
- `reply_to` - Reply-to address
- `track_opens` - Track opens (default: false)
- `track_clicks` - Track clicks (default: false)
- `scheduled_send_at` - ISO 8601 datetime
- `scheduled_timezone` - Timezone for scheduled send
- `segment_ids` - Array of segment IDs
- `email_server_ids` - Array of email server IDs

**Request:**
```json
{
  "broadcast": {
    "subject": "Test Subject",
    "preheader": "Test Preheader",
    "body": "<p>Test Body</p>",
    "name": "Test Name",
    "reply_to": "support@example.com",
    "track_opens": true,
    "track_clicks": true
  }
}
```

**Body Format Notes:**
- Must be valid HTML
- Use `<br>` for line breaks
- Use `<p>` tags for paragraphs
- Don't include `<html>`, `<head>`, `<body>` tags
- Broadcast wraps content automatically

**Response:**
```json
{
  "id": 123
}
```

### Update Broadcast

```
PATCH /api/v1/broadcasts/:id
```

Only broadcasts in `draft` or `scheduled` status can be updated.

**Request:**
```json
{
  "broadcast": {
    "subject": "Updated Subject",
    "body": "<p>Updated content</p>"
  }
}
```

### Delete Broadcast

```
DELETE /api/v1/broadcasts/:id
```

Only broadcasts in `draft` or `scheduled` status can be deleted.

### Send Broadcast

```
POST /api/v1/broadcasts/:id/send_broadcast
```

Broadcast must be in `draft` or `failed` status and have required content.

**Response:**
```json
{
  "id": 123,
  "message": "Broadcast queued for sending",
  "status": "queueing"
}
```

### Get Statistics

```
GET /api/v1/broadcasts/:id/statistics
```

**Response:**
```json
{
  "broadcast_id": 123,
  "broadcast_name": "Weekly Newsletter",
  "status": "sent",
  "total_recipients": 10000,
  "delivery": {
    "sent": 9850,
    "failed": 150,
    "delivery_rate": 98.5
  },
  "engagement": {
    "opens": { "count": 4500, "rate": 45.0 },
    "clicks": { "count": 1200, "rate": 12.0 }
  },
  "issues": {
    "bounces": { "count": 150, "rate": 1.5 },
    "complaints": { "count": 5, "rate": 0.05 },
    "unsubscribes": { "count": 25, "rate": 0.25 }
  }
}
```

### Statistics Timeline

```
GET /api/v1/broadcasts/:id/statistics/timeline
```

**Query Parameters:**
- `timeframe` - `60m`, `24h`, `7d`, `14d` (default: `24h`)
- `metrics` - `processed`, `delivered`, `opens`, `clicks`, `bounces`

## Error Responses

**400 Bad Request:**
```json
{ "error": "Broadcast is not ready to send" }
```

**401 Unauthorized:**
```json
{ "error": "Unauthorized" }
```

**404 Not Found:**
```json
{ "error": "Broadcast not found" }
```

**422 Unprocessable Entity:**
```json
{ "error": "Subject can't be blank, Body can't be blank" }
```
