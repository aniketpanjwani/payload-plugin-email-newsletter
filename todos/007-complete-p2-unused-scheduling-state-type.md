---
status: complete
priority: p2
issue_id: "007"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# SchedulingState Type - Now Used via Factory Functions

## Problem Statement

The `SchedulingState` type was defined but never used, creating dead code and misleading developers.

## Resolution

Instead of removing the type, we implemented **Option B: State Factory Functions** to make it useful.

### Changes Made

**1. Updated `SchedulingState` type to use enum values:**
```typescript
export type SchedulingState =
  | { sendStatus: BroadcastStatus.DRAFT; scheduledAt: null }
  | { sendStatus: BroadcastStatus.SCHEDULED; scheduledAt: string }
  | { sendStatus: BroadcastStatus.SENDING; scheduledAt?: string | null }
  | { sendStatus: BroadcastStatus.SENT; scheduledAt?: string | null }
  | { sendStatus: BroadcastStatus.FAILED; scheduledAt?: string | null }
```

**2. Added factory functions to `scheduling-state.ts`:**
- `draftState()` - Returns `{ sendStatus: DRAFT, scheduledAt: null }`
- `scheduledState(date)` - Returns `{ sendStatus: SCHEDULED, scheduledAt: ISO string }`
- `sendingState()` - Returns `{ sendStatus: SENDING }`
- `sentState()` - Returns `{ sendStatus: SENT }`
- `failedState()` - Returns `{ sendStatus: FAILED }`

**3. Updated all state constructions to use factories:**
- `Broadcasts.ts` - 4 locations updated
- `schedule.ts` - 2 locations updated

### Benefits

- **Compile-time safety**: Can't create invalid states like `{ sendStatus: 'draft', scheduledAt: '2024-01-01' }`
- **Single source of truth**: State construction logic in one place
- **Self-documenting**: Factory function names make intent clear
- **Type inferences**: TypeScript knows exact return types

## Acceptance Criteria

- [x] SchedulingState type updated to use enum values
- [x] Factory functions created for all valid states
- [x] All manual state constructions replaced with factory calls
- [x] TypeScript compiles successfully

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | YAGNI violation found |
| 2026-01-03 | Implemented factory functions instead of removing | Better outcome than deletion |

## Resources

- Factory functions: `src/utils/scheduling-state.ts`
- Type definition: `src/types/scheduling.ts`
