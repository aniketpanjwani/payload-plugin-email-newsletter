/**
 * Sync Broadcast Status - Polling fallback for stuck broadcasts
 *
 * This utility function checks for broadcasts stuck in 'sending' status
 * and polls the Broadcast API to get their actual status.
 *
 * Usage: Call from a cron job or scheduled task:
 *   await syncStuckBroadcasts(payload, config, { maxAgeMinutes: 10 })
 */

import type { Payload } from 'payload'
import type { NewsletterPluginConfig, BroadcastProviderConfig } from '../types'
import { BroadcastStatus } from '../types'
import { getBroadcastConfig } from '../utils/getBroadcastConfig'

export interface SyncOptions {
  /** Only sync broadcasts stuck for longer than this (default: 10 minutes) */
  maxAgeMinutes?: number
  /** Maximum broadcasts to process per run (default: 20) */
  limit?: number
  /** Enable verbose logging */
  verbose?: boolean
}

export interface SyncResult {
  checked: number
  updated: number
  errors: number
  details: Array<{
    broadcastId: string
    providerId: string
    oldStatus: string
    newStatus: string | null
    error?: string
  }>
}

/**
 * Find and sync broadcasts stuck in 'sending' status
 */
export async function syncStuckBroadcasts(
  payload: Payload,
  pluginConfig: NewsletterPluginConfig,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const {
    maxAgeMinutes = 10,
    limit = 20,
    verbose = false,
  } = options

  const result: SyncResult = {
    checked: 0,
    updated: 0,
    errors: 0,
    details: [],
  }

  const log = verbose ? console.log : () => {}

  try {
    // Get provider config
    const req = { payload } as any
    const providerConfig = await getBroadcastConfig(req, pluginConfig)

    if (!providerConfig?.token) {
      log('[SyncBroadcastStatus] No broadcast provider configured')
      return result
    }

    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000)

    // Find broadcasts stuck in 'sending' status
    const stuckBroadcasts = await payload.find({
      collection: 'broadcasts',
      where: {
        and: [
          { sendStatus: { equals: BroadcastStatus.SENDING } },
          { updatedAt: { less_than: cutoffTime.toISOString() } },
          { providerId: { exists: true } },
        ],
      },
      limit,
      sort: 'updatedAt', // Oldest first
    })

    log(`[SyncBroadcastStatus] Found ${stuckBroadcasts.docs.length} stuck broadcasts`)

    if (stuckBroadcasts.docs.length === 0) {
      return result
    }

    // Import provider
    const { BroadcastApiProvider } = await import('../providers/broadcast/broadcast')
    const provider = new BroadcastApiProvider(providerConfig)

    // Check each stuck broadcast
    for (const broadcast of stuckBroadcasts.docs) {
      result.checked++

      const detail: SyncResult['details'][0] = {
        broadcastId: String(broadcast.id),
        providerId: String(broadcast.providerId),
        oldStatus: String(broadcast.sendStatus),
        newStatus: null,
      }

      try {
        // Get status from provider
        const providerBroadcast = await provider.get(broadcast.providerId as string)

        if (!providerBroadcast) {
          log(`[SyncBroadcastStatus] Broadcast ${broadcast.id} not found in provider`)
          detail.error = 'Not found in provider'
          result.errors++
          result.details.push(detail)
          continue
        }

        // Map provider status to our status
        const statusMap: Record<string, string> = {
          draft: BroadcastStatus.DRAFT,
          scheduled: BroadcastStatus.SCHEDULED,
          sending: BroadcastStatus.SENDING,
          sent: BroadcastStatus.SENT,
          failed: BroadcastStatus.FAILED,
          canceled: BroadcastStatus.CANCELED,
          paused: BroadcastStatus.PAUSED,
        }

        const newStatus = statusMap[providerBroadcast.sendStatus] || providerBroadcast.sendStatus
        detail.newStatus = newStatus

        // Only update if status actually changed
        if (newStatus !== broadcast.sendStatus) {
          await payload.update({
            collection: 'broadcasts',
            id: broadcast.id,
            data: {
              sendStatus: newStatus,
              'webhookData.lastWebhookEvent': `polling.sync.${newStatus}`,
              'webhookData.lastWebhookEventAt': new Date().toISOString(),
            } as any,
          })

          log(`[SyncBroadcastStatus] Updated ${broadcast.id}: ${broadcast.sendStatus} -> ${newStatus}`)
          result.updated++
        } else {
          log(`[SyncBroadcastStatus] ${broadcast.id} still ${newStatus}`)
        }

        result.details.push(detail)
      } catch (error) {
        detail.error = error instanceof Error ? error.message : 'Unknown error'
        result.errors++
        result.details.push(detail)
        console.error(`[SyncBroadcastStatus] Error syncing ${broadcast.id}:`, error)
      }
    }

    log(`[SyncBroadcastStatus] Sync complete: ${result.updated} updated, ${result.errors} errors`)
    return result
  } catch (error) {
    console.error('[SyncBroadcastStatus] Failed to sync stuck broadcasts:', error)
    throw error
  }
}
