---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, data-integrity, race-condition]
dependencies: []
---

# Non-Atomic Provider + Database Updates Create State Divergence Risk

## Problem Statement

The scheduling workflow performs two sequential operations without transactional guarantees: provider API call followed by Payload database update. If the provider call succeeds but the database update fails, the system enters an inconsistent state where the email IS scheduled in the provider but the local state shows "draft".

**Why it matters:**
- Users may schedule the same email twice (duplicate sends)
- System state becomes unreliable
- Difficult to debug/recover from inconsistent states

## Findings

### Evidence
- **Location:** `src/collections/Broadcasts.ts:667-677`
  ```typescript
  await provider.schedule(broadcastDoc.providerId, publishedAt)
  // GAP: If this fails, provider is scheduled but local isn't
  await req.payload.update({
    collection: 'broadcasts',
    id: broadcastDoc.id,
    data: { sendStatus: BroadcastStatus.SCHEDULED, ... },
  })
  ```

### Risk Scenario
1. `provider.schedule()` succeeds - Email scheduled in provider
2. `req.payload.update()` fails - Database error, network issue
3. Result: Email WILL send, but local state shows "draft"
4. User sees draft, schedules again - DUPLICATE SEND

### Discovered by
- Data Integrity Guardian (P1)
- Security Sentinel (P2 - race condition)

## Proposed Solutions

### Option A: Two-Phase Commit Pattern (Recommended)
**Pros:** Proper distributed transaction handling
**Cons:** More complex, adds intermediate state
**Effort:** Medium (4-6 hours)
**Risk:** Medium

```typescript
// 1. Mark as "scheduling_pending" BEFORE provider call
await req.payload.update({
  data: { sendStatus: 'scheduling_pending' }
})

// 2. Call provider
await provider.schedule(...)

// 3. On success, update to "scheduled"
await req.payload.update({
  data: { sendStatus: BroadcastStatus.SCHEDULED }
})

// 4. On failure, revert to "draft" with error info
```

### Option B: Idempotency Keys
**Pros:** Simpler, provider handles deduplication
**Cons:** Depends on provider support
**Effort:** Small (2-3 hours)
**Risk:** Low

```typescript
await provider.schedule(broadcastDoc.providerId, publishedAt, {
  idempotencyKey: `${broadcastDoc.id}-schedule-${publishedAt.getTime()}`
})
```

### Option C: Reconciliation Job
**Pros:** Catches all edge cases
**Cons:** Delayed consistency, more infrastructure
**Effort:** Large (8-12 hours)
**Risk:** Medium

## Recommended Action

Option B (Idempotency Keys) as immediate fix, Option C (Reconciliation Job) as follow-up

## Technical Details

**Affected files:**
- `src/collections/Broadcasts.ts:667-677` - Schedule path
- `src/collections/Broadcasts.ts:688-703` - Send path
- `src/collections/Broadcasts.ts:781-782` - Reschedule path
- `src/providers/broadcast/broadcast.ts` - Add idempotency support

## Acceptance Criteria

- [ ] Provider operations include idempotency keys where supported
- [ ] Partial failures don't leave system in inconsistent state
- [ ] Duplicate schedule attempts are detected and prevented
- [ ] Clear error messaging when state divergence detected

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Critical data integrity issue found |

## Resources

- PR: feat/unified-email-scheduling branch
- Pattern: Saga pattern for distributed transactions
- Related: `src/utils/scheduling-state.ts`
