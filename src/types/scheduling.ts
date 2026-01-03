import { BroadcastStatus } from './broadcast'

/**
 * Document shape for Broadcast with scheduling fields.
 * Used for type narrowing in afterChange hooks.
 */
export interface BroadcastDocument {
  id: string
  _status?: 'draft' | 'published'
  emailOnly?: boolean
  publishedAt?: string | null
  providerId?: string | null
  sendStatus?: BroadcastStatus
  scheduledAt?: string | null
  sendError?: string | null
  subject?: string
  contentSection?: {
    content?: unknown
    preheader?: string
  }
  settings?: {
    trackOpens?: boolean
    trackClicks?: boolean
    replyTo?: string
  }
  audienceIds?: Array<{ audienceId: string }>
}

/**
 * Valid state combinations for scheduling (discriminated union).
 * Used by state factory functions to ensure we don't end up in invalid states.
 */
export type SchedulingState =
  | { sendStatus: BroadcastStatus.DRAFT; scheduledAt: null }
  | { sendStatus: BroadcastStatus.SCHEDULED; scheduledAt: string }
  | { sendStatus: BroadcastStatus.SENDING; scheduledAt?: string | null }
  | { sendStatus: BroadcastStatus.SENT; scheduledAt?: string | null }
  | { sendStatus: BroadcastStatus.FAILED; scheduledAt?: string | null }

/**
 * State transition detection result.
 * Returned by detectStateTransition() to determine what action to take.
 */
export interface StateTransition {
  /** Document was unpublished (draft or no status) */
  wasUnpublished: boolean
  /** Document is now published */
  isNowPublished: boolean
  /** Document was scheduled (draft with future publishedAt) */
  wasScheduled: boolean
  /** Document is no longer scheduled (publishedAt removed) */
  isNoLongerScheduled: boolean
  /** Schedule time changed from previous value */
  scheduleTimeChanged: boolean
  /** User clicked Publish while a schedule was pending (should send immediately) */
  isManualPublish: boolean
}

/**
 * Hook context for preventing recursive updates.
 * When isSchedulingUpdate is true, the hook skips its logic.
 * Extends RequestContext pattern with index signature for Payload compatibility.
 */
export interface BroadcastHookContext {
  isSchedulingUpdate?: boolean
  [key: string]: unknown
}
