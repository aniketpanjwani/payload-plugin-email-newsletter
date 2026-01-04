---
status: pending
priority: p3
issue_id: "010"
tags: [code-review, cleanup, lint]
dependencies: []
---

# Unused Imports in ScheduleModal.tsx

## Problem Statement

`useModal` and `useDocumentInfo` are imported but never used in `ScheduleModal.tsx`.

## Findings

### Evidence
- **Location:** `src/components/Broadcasts/ScheduleModal.tsx:4`
  ```typescript
  import { useModal, useDocumentInfo } from '@payloadcms/ui'
  ```
- **Usage:** Neither is used in the component

### Discovered by
- Architecture Strategist (P3.2)

## Proposed Solutions

### Option A: Remove Unused Imports (Recommended)
**Effort:** Trivial (1 minute)

## Acceptance Criteria

- [ ] Unused imports removed
- [ ] Lint passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Pre-existing lint issue |
