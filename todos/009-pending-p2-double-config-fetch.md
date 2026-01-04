---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, performance, optimization]
dependencies: []
---

# Double Database Query for Config on Every Hook Execution

## Problem Statement

Both afterChange hooks call `getBroadcastConfig()` which queries the `newsletter-settings` global. When both hooks execute (on scheduling operations), the same config is fetched twice per save.

**Why it matters:**
- 2x database queries for identical data
- Adds latency to every save operation
- Wastes database resources at scale

## Findings

### Evidence
- **First hook:** `src/collections/Broadcasts.ts:428`
  ```typescript
  const providerConfig = await getBroadcastConfig(req, pluginConfig)
  ```
- **Second hook via utility:** `src/collections/Broadcasts.ts:648`
  ```typescript
  const provider = await getBroadcastProvider(req, pluginConfig)
  // getBroadcastProvider internally calls getBroadcastConfig
  ```

### Discovered by
- Performance Oracle (P1.2)

## Proposed Solutions

### Option A: Cache in Request Context (Recommended)
**Pros:** Single query per request, simple change
**Cons:** None significant
**Effort:** Small (1 hour)
**Risk:** Low

```typescript
// In getBroadcastConfig.ts
export async function getBroadcastConfig(req: PayloadRequest, pluginConfig: NewsletterPluginConfig) {
  // Check cache first
  if (req.context?.broadcastConfig) {
    return req.context.broadcastConfig
  }

  const config = await /* existing logic */

  // Cache for subsequent calls in same request
  req.context = { ...req.context, broadcastConfig: config }
  return config
}
```

### Option B: Pass Config Between Hooks
**Pros:** No external caching
**Cons:** Hooks must coordinate, complex
**Effort:** Medium
**Risk:** Medium

## Recommended Action

Option A - Cache in request context

## Technical Details

**Affected files:**
- `src/utils/getBroadcastConfig.ts` - Add caching

## Acceptance Criteria

- [ ] Config only fetched once per request
- [ ] Cache properly invalidated between requests
- [ ] No regression in functionality

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Easy performance win |

## Resources

- PR: feat/unified-email-scheduling branch
- Utility: `src/utils/getBroadcastConfig.ts`
