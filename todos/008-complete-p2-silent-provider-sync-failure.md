---
status: complete
priority: p2
issue_id: "008"
tags: [code-review, architecture, error-handling]
dependencies: []
---

# Silent Error Swallowing in Provider Sync Hook

## Problem Statement

The provider sync hook caught errors and logged them but never threw or updated the document to indicate failure. Users saw "save successful" while the provider state was out of sync.

## Resolution

Implemented **Option A: Add providerSyncStatus field with UI indicator and retry functionality**.

### Schema Changes

Added three new fields to Broadcasts collection:

```typescript
{
  name: 'providerSyncStatus',
  type: 'select',
  options: ['pending', 'synced', 'failed'],
  admin: {
    position: 'sidebar',
    components: { Field: 'payload-plugin-newsletter/components#SyncStatusField' }
  }
},
{
  name: 'providerSyncError',
  type: 'text',
  admin: { condition: (data) => data?.providerSyncStatus === 'failed' }
},
{
  name: 'lastSyncAttempt',
  type: 'date'
}
```

### Hook Changes

- **On sync failure**: Updates `providerSyncStatus` to `'failed'` with error message
- **On sync success**: Updates `providerSyncStatus` to `'synced'`
- **On create**: Sets initial sync status to `'synced'`

### New UI Component

Created `SyncStatusField.tsx` that displays:
- **Pending**: Neutral info message
- **Synced**: Green success badge with last sync time
- **Failed**: Red warning with error message, last attempt time, and **Retry** button

### New Endpoint

Created `POST /api/broadcasts/:id/retry-sync` endpoint that:
- Re-syncs broadcast content with provider
- Updates sync status on success/failure
- Handles both create (new broadcasts) and update (existing) cases

## Files Changed

- `src/collections/Broadcasts.ts` - Schema fields, endpoint registration, hook updates
- `src/components/Broadcasts/SyncStatusField.tsx` - New UI component
- `src/components/Broadcasts/index.ts` - Export new component
- `src/endpoints/broadcasts/retry-sync.ts` - New retry endpoint

## Acceptance Criteria

- [x] Sync failures are visible in admin UI
- [x] Users can retry failed syncs via button
- [x] Clear error message shown
- [x] Success state clearly indicated
- [x] TypeScript compiles successfully

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Silent failures hard to debug |
| 2026-01-03 | Implemented full solution with UI and retry | Users now have visibility and control |

## Resources

- UI Component: `src/components/Broadcasts/SyncStatusField.tsx`
- Retry Endpoint: `src/endpoints/broadcasts/retry-sync.ts`
