---
status: complete
priority: p2
issue_id: "004"
tags: [code-review, simplicity, dry-violation]
dependencies: []
---

# Duplicate Provider Initialization Pattern (DRY Violation)

## Problem Statement

The utility `getProvider.ts` was created but is NOT used consistently. The same 8-line provider initialization pattern is repeated 4 times across the codebase.

**Why it matters:**
- Code duplication increases maintenance burden
- Inconsistent error handling between locations
- Changes must be made in 4 places instead of 1

## Findings

### Evidence
- **Utility exists:** `src/utils/getProvider.ts` (31 lines)
- **Used in:** Scheduling hook at `Broadcasts.ts:648`
- **NOT used in:**
  - First afterChange hook: `Broadcasts.ts:427-435`
  - Delete hook: `Broadcasts.ts:823-833`
  - Send endpoint: `src/endpoints/broadcasts/send.ts:62-72`
  - Schedule endpoint: `src/endpoints/broadcasts/schedule.ts:87-96`

### Duplicated Pattern
```typescript
const providerConfig = await getBroadcastConfig(req, pluginConfig)
if (!providerConfig || !providerConfig.token) {
  // error handling (varies by location)
}
const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
const provider = new BroadcastApiProvider(providerConfig)
```

### Discovered by
- Code Simplicity Reviewer (P1)
- Architecture Strategist (P1.2)

## Resolution

**Applied Option A:** Replaced all instances with `getBroadcastProvider()`

**Changes made:**
- `src/collections/Broadcasts.ts` - First afterChange hook now uses `getBroadcastProvider()`
- `src/collections/Broadcasts.ts` - afterDelete hook now uses `getBroadcastProvider()`
- `src/endpoints/broadcasts/send.ts` - Now uses `getBroadcastProvider()` with `BroadcastProviderError` handling
- `src/endpoints/broadcasts/schedule.ts` - POST handler now uses `getBroadcastProvider()` with `BroadcastProviderError` handling

## Acceptance Criteria

- [x] All provider initialization uses `getBroadcastProvider()`
- [x] Error handling is consistent across all locations
- [x] Tests pass (typecheck passes)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Utility was created but not fully adopted |
| 2026-01-03 | Fixed - replaced all inline patterns with getBroadcastProvider() | Added BroadcastProviderError handling to catch blocks |

## Resources

- PR: feat/unified-email-scheduling branch
- Utility: `src/utils/getProvider.ts`
