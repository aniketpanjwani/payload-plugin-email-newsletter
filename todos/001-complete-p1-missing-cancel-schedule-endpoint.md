---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, api, agent-native, blocks-merge]
dependencies: []
---

# Missing DELETE /api/broadcasts/:id/schedule Endpoint

## Problem Statement

The `CancelScheduleButton` UI component makes a DELETE request to `/api/broadcasts/${broadcastId}/schedule`, but no endpoint handler exists for the DELETE method. This breaks cancel functionality for email-only broadcasts and violates agent-native architecture principles.

**Why it matters:**
- Email-only broadcast cancellation is completely broken in the UI
- Agents cannot cancel scheduled email-only broadcasts via API
- Users clicking "Cancel Schedule" will see a 404/405 error

## Findings

### Evidence
- **UI call location:** `src/components/Broadcasts/CancelScheduleButton.tsx:41-42`
  ```typescript
  const response = await fetch(`/api/broadcasts/${broadcastId}/schedule`, {
    method: 'DELETE',
  })
  ```
- **Existing endpoint:** `src/endpoints/broadcasts/schedule.ts` only has `method: 'post'`
- **Agents affected:** Any automation trying to cancel email-only scheduled broadcasts

### Discovered by
- Architecture Strategist (P2.4)
- Agent-Native Reviewer (P1)

## Proposed Solutions

### Option A: Add DELETE handler to existing schedule.ts (Recommended)
**Pros:** Single file change, consistent with REST conventions
**Cons:** None significant
**Effort:** Small (1-2 hours)
**Risk:** Low

```typescript
export const createCancelScheduleBroadcastEndpoint = (
  config: NewsletterPluginConfig,
  collectionSlug: string
): Endpoint => ({
  path: '/:id/schedule',
  method: 'delete',
  handler: async (req) => {
    // 1. Verify auth
    // 2. Get broadcast, verify it's scheduled
    // 3. Call provider.cancelSchedule()
    // 4. Update sendStatus to DRAFT, clear scheduledAt
  }
})
```

### Option B: Create separate cancel-schedule.ts endpoint
**Pros:** Separation of concerns
**Cons:** More files, inconsistent with current pattern
**Effort:** Small (1-2 hours)
**Risk:** Low

## Recommended Action

Option A - Add DELETE handler to schedule.ts

## Technical Details

**Affected files:**
- `src/endpoints/broadcasts/schedule.ts` - Add DELETE handler
- `src/collections/Broadcasts.ts:57-62` - Register new endpoint

**Testing required:**
- Manual test: Schedule email-only broadcast, click Cancel, verify cancellation
- API test: DELETE /api/broadcasts/:id/schedule returns 200 and clears schedule

## Acceptance Criteria

- [ ] DELETE /api/broadcasts/:id/schedule endpoint exists
- [ ] CancelScheduleButton successfully cancels schedules
- [ ] Provider's cancelSchedule() is called
- [ ] Document sendStatus updated to DRAFT
- [ ] scheduledAt field cleared
- [ ] Agents can cancel schedules via API

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Found by Architecture Strategist and Agent-Native Reviewer |

## Resources

- PR: feat/unified-email-scheduling branch
- Related: `src/endpoints/broadcasts/schedule.ts`
- Related: `src/components/Broadcasts/CancelScheduleButton.tsx`
