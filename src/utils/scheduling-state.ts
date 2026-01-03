import type { BroadcastDocument, StateTransition } from '../types/scheduling'

/**
 * Detect all relevant state transitions for scheduling logic.
 * Pure function for easy testing.
 *
 * @param previousDoc - The document state before the change (may be undefined on create)
 * @param currentDoc - The current document state after the change
 * @returns StateTransition object describing what changed
 */
export function detectStateTransition(
  previousDoc: BroadcastDocument | undefined,
  currentDoc: BroadcastDocument
): StateTransition {
  const wasUnpublished = !previousDoc?._status || previousDoc._status === 'draft'
  const isNowPublished = currentDoc._status === 'published'

  // Scheduled = draft status with future publishedAt
  const wasScheduled = previousDoc?._status === 'draft' && !!previousDoc?.publishedAt
  const isNoLongerScheduled = currentDoc._status === 'draft' && !currentDoc.publishedAt

  const scheduleTimeChanged = previousDoc?.publishedAt !== currentDoc.publishedAt

  // Manual publish = was scheduled but now published without waiting for job
  // Detected when: was draft+scheduled, now published, but publishedAt is still in the future
  const publishedAtDate = currentDoc.publishedAt ? new Date(currentDoc.publishedAt) : null
  const isManualPublish =
    wasUnpublished &&
    isNowPublished &&
    publishedAtDate !== null &&
    publishedAtDate.getTime() > Date.now()

  return {
    wasUnpublished,
    isNowPublished,
    wasScheduled,
    isNoLongerScheduled,
    scheduleTimeChanged,
    isManualPublish,
  }
}

/**
 * Check if two dates represent the same scheduled time.
 * Handles string/Date comparison safely.
 *
 * @param a - Scheduled time as ISO string (from document)
 * @param b - Scheduled time as Date object
 * @returns true if times are equal, false otherwise
 */
export function areScheduledTimesEqual(
  a: string | null | undefined,
  b: Date | null
): boolean {
  if (!a || !b) return false
  return new Date(a).getTime() === b.getTime()
}

/**
 * Validate a date string and return a Date object or null.
 * Returns null for invalid or missing date strings.
 *
 * @param dateStr - ISO date string to parse
 * @returns Date object if valid, null otherwise
 */
export function parseScheduledDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  return date
}
