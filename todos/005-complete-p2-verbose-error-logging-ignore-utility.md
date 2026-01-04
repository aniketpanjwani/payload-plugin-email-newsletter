---
status: complete
priority: p2
issue_id: "005"
tags: [code-review, simplicity, dry-violation]
dependencies: []
---

# Verbose Error Logging Ignores Existing getErrorDetails() Utility

## Problem Statement

The provider sync hook has 20 lines of verbose error type checking that duplicates what the `getErrorDetails()` utility already provides.

**Why it matters:**
- Code duplication
- Utility was created specifically for this purpose but not used
- Inconsistent error object shapes

## Resolution

Replaced 30+ lines of verbose error logging with the `getErrorDetails()` utility:

```typescript
} catch (error: unknown) {
  req.payload.logger.error(
    {
      broadcastId: doc.id,
      subject: doc.subject,
      error: getErrorDetails(error),
    },
    'Failed to sync broadcast to provider'
  )
}
```

## Acceptance Criteria

- [x] Error logging uses `getErrorDetails()` utility
- [x] Error object shape is consistent with other locations
- [x] All relevant error information is still captured

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Utility created but not fully adopted |
| 2026-01-03 | Fixed - replaced verbose block with getErrorDetails() | ~25 lines reduced to 8 |

## Resources

- PR: feat/unified-email-scheduling branch
- Utility: `src/utils/getErrorMessage.ts`
