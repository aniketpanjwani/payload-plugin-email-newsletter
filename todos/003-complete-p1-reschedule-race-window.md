---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, data-integrity, race-condition]
dependencies: ["002"]
---

# Reschedule Operation Has Dangerous Race Window

## Problem Statement

When rescheduling a broadcast, the code performs `cancelSchedule()` then `schedule()` as separate operations. If the cancel succeeds but schedule fails, the email is completely unscheduled - worse than the original state.

**Why it matters:**
- User believes email is rescheduled when it's actually cancelled
- Email may not send at all (silent failure)
- No automatic recovery or user notification

## Findings

### Evidence
- **Location:** `src/collections/Broadcasts.ts:781-782`
  ```typescript
  await provider.cancelSchedule(broadcastDoc.providerId)
  await provider.schedule(broadcastDoc.providerId, publishedAt)
  // If schedule() fails, email is now completely unscheduled!
  ```

### Risk Scenario
1. Email scheduled for 3pm
2. User reschedules to 5pm
3. `cancelSchedule()` succeeds - 3pm schedule removed
4. `schedule()` fails - network error
5. Local state still shows "scheduled" (update never ran)
6. Email will NOT send at all
7. User has no idea

### Discovered by
- Data Integrity Guardian (P1)

## Proposed Solutions

### Option A: Store Previous Schedule for Recovery (Recommended)
**Pros:** Can restore original schedule on failure
**Cons:** Extra complexity
**Effort:** Medium (3-4 hours)
**Risk:** Low

```typescript
const previousSchedule = broadcastDoc.scheduledAt

try {
  await provider.cancelSchedule(broadcastDoc.providerId)
  await provider.schedule(broadcastDoc.providerId, publishedAt)
} catch (error) {
  // Attempt to restore previous schedule
  if (previousSchedule) {
    try {
      await provider.schedule(broadcastDoc.providerId, new Date(previousSchedule))
      req.payload.logger.warn('Reschedule failed, restored original schedule')
    } catch {
      // Log critical: email now unscheduled
      req.payload.logger.error('CRITICAL: Email is now unscheduled, manual intervention required')
    }
  }
  throw error
}
```

### Option B: Use Provider's Update Endpoint
**Pros:** Single atomic operation
**Cons:** May not be supported by all providers
**Effort:** Small (1-2 hours)
**Risk:** Low

### Option C: Verify State Before and After
**Pros:** Catches all failure modes
**Cons:** Extra API calls
**Effort:** Medium (2-3 hours)
**Risk:** Low

## Recommended Action

Option A - Store previous schedule for recovery

## Technical Details

**Affected files:**
- `src/collections/Broadcasts.ts:776-812` - Reschedule logic

## Acceptance Criteria

- [ ] Failed reschedule attempts restore original schedule
- [ ] Clear error logged when recovery also fails
- [ ] User notified of reschedule failure
- [ ] No silent complete unscheduling

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Related to #002 non-atomic operations |

## Resources

- PR: feat/unified-email-scheduling branch
- Depends on: #002 (shares root cause)
