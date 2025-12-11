# Subscribers API

Programmatic management of subscriber lists with comprehensive filtering.

## Required Permissions

- **Read:** List and read subscribers
- **Write:** Create, update, and redact subscribers

## Subscriber Object

| Field | Description |
|-------|-------------|
| `id` | Subscriber ID |
| `email` | Email address |
| `first_name` | First name |
| `last_name` | Last name |
| `ip_address` | IP address |
| `is_active` | Whether active |
| `source` | How they subscribed |
| `subscribed_at` | Subscription timestamp |
| `unsubscribed_at` | Unsubscription timestamp |
| `last_email_sent_at` | Last email sent |
| `created_at` | Creation timestamp |
| `tags` | Array of tags |
| `custom_data` | JSON key-value pairs |
| `redacted` | If PII has been redacted |

## Endpoints

### List Subscribers

```
GET /api/v1/subscribers.json
```

**Pagination:**
- `page` - Page number (default: 1)

**Filtering:**

| Parameter | Description |
|-----------|-------------|
| `subscription_status` | `subscribed`, `unsubscribed`, `active`, `inactive` |
| `source` | How added: `website`, `api`, `import` |
| `subscribed_after` | ISO 8601 date |
| `subscribed_before` | ISO 8601 date |
| `emailed_after` | ISO 8601 date |
| `emailed_before` | ISO 8601 date |
| `email_contains` | Text to match in email |
| `tags[]` | Filter by tags (multiple allowed) |
| `tag_match_type` | `any` (OR, default) or `all` (AND) |
| `custom_data[field]` | Filter by custom data |

**Tag Filtering Examples:**

OR logic (any tag matches):
```
GET /api/v1/subscribers.json?tags[]=premium&tags[]=newsletter&tag_match_type=any
```

AND logic (all tags required):
```
GET /api/v1/subscribers.json?tags[]=premium&tags[]=newsletter&tag_match_type=all
```

**Response:**
```json
{
  "subscribers": [
    {
      "id": "123",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "tags": ["newsletter", "premium"],
      "custom_data": { "plan": "pro" }
    }
  ],
  "pagination": {
    "total": 1500,
    "count": 250,
    "current": 1,
    "total_pages": 6
  }
}
```

### Find Subscriber

```
GET /api/v1/subscribers/find.json?email=user@example.com
```

### Create Subscriber

```
POST /api/v1/subscribers.json
```

**Request:**
```json
{
  "subscriber": {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "ip_address": "192.168.1.1",
    "source": "api",
    "tags": ["newsletter"],
    "custom_data": { "plan": "pro" }
  }
}
```

**Notes:**
- `is_active` automatically set to `true`
- If subscriber exists and was unsubscribed, they're resubscribed
- Tags must be array of strings

**Response:** 201 Created

### Update Subscriber

```
PATCH /api/v1/subscribers.json
```

**Request:**
```json
{
  "email": "user@example.com",
  "subscriber": {
    "first_name": "Jane"
  }
}
```

Note: Email identifies the record, nested `subscriber` contains updates.

### Unsubscribe

```
POST /api/v1/subscribers/unsubscribe.json
```

Sets `unsubscribed_at` AND `is_active: false`.

**Request:**
```json
{ "email": "user@example.com" }
```

### Resubscribe

```
POST /api/v1/subscribers/resubscribe.json
```

Clears `unsubscribed_at` AND sets `is_active: true`.

### Activate/Deactivate

Only changes `is_active`, NOT `unsubscribed_at`.

```
POST /api/v1/subscribers/activate.json
POST /api/v1/subscribers/deactivate.json
```

**When to use:**
- **Unsubscribe/Resubscribe:** Legal opt-out, compliance (CAN-SPAM, GDPR)
- **Activate/Deactivate:** Temporary pause, system-level control, A/B testing

### Add Tags

```
POST /api/v1/subscribers/add_tag.json
```

**Request:**
```json
{
  "email": "user@example.com",
  "tags": ["premium", "vip"]
}
```

### Remove Tags

```
DELETE /api/v1/subscribers/remove_tag.json
```

**Request:**
```json
{
  "email": "user@example.com",
  "tags": ["premium"]
}
```

### Redact Subscriber (GDPR)

```
POST /api/v1/subscribers/redact.json
```

**WARNING: Irreversible!**

Permanently removes PII while preserving campaign statistics:
- Email → anonymized identifier
- Names → null
- Custom data → cleared
- IP addresses → removed

Campaign statistics and metrics are preserved.

**Request:**
```json
{ "email": "user@example.com" }
```

## Common Use Cases

- **CRM Sync:** Filter `subscription_status=unsubscribed` to sync opt-outs
- **Segment Export:** Filter by tags, source, or activity
- **Compliance:** Retrieve subscription status for reporting
- **Data Cleanup:** Find inactive subscribers by `emailed_before`
