import type { CollectionConfig } from 'payload'
import type { SerializedEditorState } from 'lexical'
import type { NewsletterPluginConfig } from '../types'
import type { BroadcastDocument, BroadcastHookContext } from '../types/scheduling'
import type { AudienceIdField } from '../types/broadcast'
import { BroadcastStatus } from '../types'
import { createEmailContentField, createEmailLexicalEditor } from '../fields/emailContent'
import { createBroadcastInlinePreviewField } from '../fields/broadcastInlinePreview'
import { createBroadcastScheduleField } from '../fields/broadcastSchedule'
import { convertToEmailSafeHtml } from '../utils/emailSafeHtml'
import { getBroadcastConfig } from '../utils/getBroadcastConfig'
import { getBroadcastProvider } from '../utils/getProvider'
import { shouldSyncToProvider, syncBroadcastToProvider } from '../utils/broadcast-sync'
import { detectStateTransition, areScheduledTimesEqual, parseScheduledDate, draftState, scheduledState, sendingState, failedState } from '../utils/scheduling-state'
import { getErrorMessage, getErrorDetails } from '../utils/getErrorMessage'
import { generateIdempotencyKey, getCompletedOperation, markOperationCompleted } from '../utils/idempotency'
import { createSendBroadcastEndpoint } from '../endpoints/broadcasts/send'
import { createScheduleBroadcastEndpoint, createCancelScheduleBroadcastEndpoint } from '../endpoints/broadcasts/schedule'
import { createRetrySyncEndpoint } from '../endpoints/broadcasts/retry-sync'
import { createTestBroadcastEndpoint } from '../endpoints/broadcasts/test'
import { createBroadcastPreviewEndpoint, populateMediaFields } from '../endpoints/broadcasts/preview'

export const createBroadcastsCollection = (pluginConfig: NewsletterPluginConfig): CollectionConfig => {
  const hasProviders = !!(pluginConfig.providers?.broadcast || pluginConfig.providers?.resend)
  const customizations = pluginConfig.customizations?.broadcasts

  const collectionSlug = 'broadcasts'

  return {
    slug: collectionSlug,
    access: {
      read: () => true, // Public read access
      create: ({ req: { user } }) => {
        // Allow authenticated users to create
        return Boolean(user)
      },
      update: ({ req: { user } }) => {
        // Allow authenticated users to update
        return Boolean(user)
      },
      delete: ({ req: { user } }) => {
        // Allow authenticated users to delete
        return Boolean(user)
      },
    },
    versions: {
      drafts: {
        autosave: true,
        schedulePublish: true,
      }
    },
    labels: {
      singular: 'Broadcast',
      plural: 'Broadcasts',
    },
    admin: {
      useAsTitle: 'subject',
      description: 'Individual email campaigns sent to subscribers',
      defaultColumns: ['subject', '_status', 'sendStatus', 'sentAt', 'recipientCount'],
    },
    endpoints: [
      createSendBroadcastEndpoint(pluginConfig, collectionSlug),
      createScheduleBroadcastEndpoint(pluginConfig, collectionSlug),
      createCancelScheduleBroadcastEndpoint(pluginConfig, collectionSlug),
      createRetrySyncEndpoint(pluginConfig, collectionSlug),
      createTestBroadcastEndpoint(pluginConfig, collectionSlug),
      createBroadcastPreviewEndpoint(pluginConfig, collectionSlug),
    ],
    fields: [
      {
        name: 'subject',
        type: 'text',
        required: true,
        admin: {
          description: 'Email subject line'
        },
      },
      {
        name: 'emailOnly',
        type: 'checkbox',
        label: 'Email Only',
        defaultValue: false,
        admin: {
          description: 'Check this to send via email only (won\'t be published on website). Use the plugin\'s Schedule Send button instead of Payload\'s Schedule Publish.',
        },
      },
      // Add any additional fields from customizations after subject
      ...(customizations?.additionalFields || []),
      {
        type: 'row',
        fields: [
          {
            name: 'contentSection',
            type: 'group',
            label: false,
            admin: {
              width: '50%',
              style: {
                paddingRight: '1rem',
              },
            },
            fields: [
              {
                name: 'preheader',
                type: 'text',
                admin: {
                  description: 'Preview text shown in email clients'
                },
              },
              // Apply content field customization if provided
              // Process blocks server-side to avoid client serialization issues
              (() => {
                // Create email editor with custom blocks processed server-side
                const emailEditor = createEmailLexicalEditor(customizations?.customBlocks)
                
                // Create base field with pre-processed editor
                const baseField = createEmailContentField({
                  admin: { description: 'Email content' },
                  editor: emailEditor
                })
                
                // Apply field overrides if provided
                return customizations?.fieldOverrides?.content
                  ? customizations.fieldOverrides.content(baseField)
                  : baseField
              })(),
            ],
          },
          {
            name: 'previewSection',
            type: 'group',
            label: false,
            admin: {
              width: '50%',
            },
            fields: [
              createBroadcastInlinePreviewField(),
            ],
          },
        ],
      },
      {
        name: 'sendStatus',
        type: 'select',
        label: 'Send Status',
        required: true,
        defaultValue: BroadcastStatus.DRAFT,
        options: [
          { label: 'Draft', value: BroadcastStatus.DRAFT },
          { label: 'Scheduled', value: BroadcastStatus.SCHEDULED },
          { label: 'Sending', value: BroadcastStatus.SENDING },
          { label: 'Sent', value: BroadcastStatus.SENT },
          { label: 'Failed', value: BroadcastStatus.FAILED },
          { label: 'Paused', value: BroadcastStatus.PAUSED },
          { label: 'Canceled', value: BroadcastStatus.CANCELED },
        ],
        admin: {
          readOnly: true,
          description: 'The status of the email send operation',
          components: {
            Cell: 'payload-plugin-newsletter/components#StatusBadge',
          },
        },
      },
      // Scheduling controls - shows schedule/cancel buttons based on status
      createBroadcastScheduleField(),
      {
        name: 'settings',
        type: 'group',
        fields: [
          {
            name: 'trackOpens',
            type: 'checkbox',
            defaultValue: true,
            admin: {
              description: 'Track when recipients open this email'
            },
          },
          {
            name: 'trackClicks',
            type: 'checkbox',
            defaultValue: true,
            admin: {
              description: 'Track when recipients click links'
            },
          },
          {
            name: 'replyTo',
            type: 'email',
            admin: {
              description: 'Override the channel reply-to address for this broadcast'
            },
          },
        ],
      },
      {
        name: 'audienceIds',
        type: 'array',
        fields: [
          {
            name: 'audienceId',
            type: 'text',
            required: true,
          },
        ],
        admin: {
          description: 'Target specific audience segments',
          condition: () => {
            // Only show if the provider supports segmentation
            return hasProviders
          },
        },
      },
      {
        name: 'analytics',
        type: 'group',
        admin: {
          readOnly: true,
          condition: (data) => data?.sendStatus === BroadcastStatus.SENT,
        },
        fields: [
          {
            name: 'recipientCount',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'sent',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'delivered',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'opened',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'clicked',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'bounced',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'complained',
            type: 'number',
            defaultValue: 0,
          },
          {
            name: 'unsubscribed',
            type: 'number',
            defaultValue: 0,
          },
        ],
      },
      {
        name: 'sentAt',
        type: 'date',
        admin: {
          readOnly: true,
          date: {
            displayFormat: 'MMM d, yyyy h:mm a',
          },
        },
      },
      {
        name: 'scheduledAt',
        type: 'date',
        admin: {
          condition: (data) => data?.sendStatus === BroadcastStatus.SCHEDULED,
          date: {
            displayFormat: 'MMM d, yyyy h:mm a',
          },
        },
      },
      {
        name: 'providerId',
        type: 'text',
        admin: {
          readOnly: true,
          description: 'ID from the email provider',
          condition: (data) => hasProviders && data?.providerId,
        },
      },
      {
        name: 'externalId',
        type: 'text',
        admin: {
          readOnly: true,
          description: 'External ID for webhook integration',
        },
      },
      {
        name: 'providerData',
        type: 'json',
        admin: {
          readOnly: true,
          condition: () => false, // Hidden by default
        },
      },
      // Provider sync status tracking
      {
        name: 'providerSyncStatus',
        type: 'select',
        label: 'Provider Sync Status',
        defaultValue: 'pending',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Synced', value: 'synced' },
          { label: 'Failed', value: 'failed' },
        ],
        admin: {
          readOnly: true,
          description: 'Status of sync with email provider',
          condition: (data) => hasProviders && data?.providerId,
          components: {
            Field: 'payload-plugin-newsletter/components#SyncStatusField',
          },
        },
      },
      {
        name: 'providerSyncError',
        type: 'text',
        admin: {
          readOnly: true,
          condition: (data) => data?.providerSyncStatus === 'failed',
          description: 'Error message from last sync attempt',
        },
      },
      {
        name: 'lastSyncAttempt',
        type: 'date',
        admin: {
          readOnly: true,
          condition: () => false, // Hidden, used for tracking
        },
      },
      // Webhook tracking fields
      {
        name: 'webhookData',
        type: 'group',
        label: 'Webhook Data',
        admin: {
          condition: () => false, // Hidden by default, used for webhook tracking
        },
        fields: [
          {
            name: 'lastWebhookEvent',
            type: 'text',
            admin: {
              readOnly: true,
            },
          },
          {
            name: 'lastWebhookEventAt',
            type: 'date',
            admin: {
              readOnly: true,
            },
          },
          {
            name: 'hasWarnings',
            type: 'checkbox',
            defaultValue: false,
          },
          {
            name: 'failureReason',
            type: 'text',
          },
          {
            name: 'sentCount',
            type: 'number',
          },
          {
            name: 'totalCount',
            type: 'number',
          },
          {
            name: 'failedCount',
            type: 'number',
          },
          {
            name: 'remainingCount',
            type: 'number',
          },
          {
            name: 'sendingStartedAt',
            type: 'date',
          },
          {
            name: 'failedAt',
            type: 'date',
          },
          {
            name: 'abortedAt',
            type: 'date',
          },
          {
            name: 'abortReason',
            type: 'text',
          },
          {
            name: 'pausedAt',
            type: 'date',
          },
          {
            name: 'webhookEvents',
            type: 'array',
            label: 'Webhook Event Log',
            maxRows: 10,
            admin: {
              readOnly: true,
              description: 'Recent webhook events for debugging',
            },
            fields: [
              {
                name: 'eventType',
                type: 'text',
                admin: { readOnly: true },
              },
              {
                name: 'receivedAt',
                type: 'date',
                admin: { readOnly: true },
              },
              {
                name: 'eventPayload',
                type: 'json',
                admin: { readOnly: true },
              },
            ],
          },
        ],
      },
    ],
    hooks: {
      // Sync with provider on create and update
      afterChange: [
        async ({ doc, operation, req, previousDoc, context }) => {
          if (!hasProviders) return doc

          // CRITICAL: Check context flag FIRST to prevent infinite loops
          // This must be at the TOP before any operation checks
          const hookContext = context as BroadcastHookContext | undefined
          if (hookContext?.isSchedulingUpdate) {
            return doc
          }

          req.payload.logger.info({
            operation,
            hasProviderId: !!doc.providerId,
            hasExternalId: !!doc.externalId,
            sendStatus: doc.sendStatus,
            publishStatus: doc._status,
            hasSubject: !!doc.subject,
            hasContent: !!doc.contentSection?.content
          }, `Broadcast afterChange ${operation} hook triggered`)

          // === CREATE OPERATION ===
          if (operation === 'create') {
            // Check if broadcast has sufficient content for sync
            if (!shouldSyncToProvider(doc)) {
              req.payload.logger.info(
                { broadcastId: doc.id },
                'Broadcast created without sufficient content - skipping provider sync'
              )
              return doc
            }

            // Sync to provider
            try {
              const provider = await getBroadcastProvider(req, pluginConfig)
              const providerConfig = await getBroadcastConfig(req, pluginConfig)

              const syncResult = await syncBroadcastToProvider(
                doc,
                req,
                pluginConfig,
                providerConfig,
                provider
              )

              if (syncResult.success) {
                req.payload.logger.info(
                  { broadcastId: doc.id, providerId: syncResult.providerId },
                  'Broadcast synced to provider on CREATE'
                )

                // Update document with provider IDs
                // Using context flag to prevent this update from re-triggering the hook
                await req.payload.update({
                  collection: collectionSlug,
                  id: doc.id,
                  data: {
                    providerId: syncResult.providerId,
                    externalId: syncResult.externalId,
                    providerData: syncResult.providerData,
                    providerSyncStatus: 'synced',
                    providerSyncError: null,
                    lastSyncAttempt: new Date().toISOString(),
                  },
                  context: { isSchedulingUpdate: true } as BroadcastHookContext,
                })

                return {
                  ...doc,
                  providerId: syncResult.providerId,
                  externalId: syncResult.externalId,
                  providerData: syncResult.providerData,
                  providerSyncStatus: 'synced',
                  providerSyncError: null,
                }
              } else {
                req.payload.logger.error(
                  { broadcastId: doc.id, error: syncResult.error },
                  'Failed to sync broadcast to provider on CREATE'
                )

                // Update document with failed status
                await req.payload.update({
                  collection: collectionSlug,
                  id: doc.id,
                  data: {
                    providerSyncStatus: 'failed',
                    providerSyncError: syncResult.error,
                    lastSyncAttempt: new Date().toISOString(),
                  },
                  context: { isSchedulingUpdate: true } as BroadcastHookContext,
                })

                return {
                  ...doc,
                  providerSyncStatus: 'failed',
                  providerSyncError: syncResult.error,
                }
              }
            } catch (error: unknown) {
              // Handle unexpected errors (e.g., provider initialization failure)
              req.payload.logger.error(
                { broadcastId: doc.id, error: getErrorDetails(error) },
                'Unexpected error during CREATE sync'
              )
              return doc
            }
          }

          // === UPDATE OPERATION ===
          if (operation === 'update') {
            try {
              // Get provider (centralized initialization)
              const provider = await getBroadcastProvider(req, pluginConfig)
              const providerConfig = await getBroadcastConfig(req, pluginConfig)

              // If no providerId/externalId and has enough content, create in provider
              if (!doc.providerId && !doc.externalId && shouldSyncToProvider(doc)) {
                req.payload.logger.info('Creating broadcast in provider on first update with content')

                const syncResult = await syncBroadcastToProvider(
                  doc,
                  req,
                  pluginConfig,
                  providerConfig,
                  provider
                )

                if (syncResult.success) {
                  req.payload.logger.info(
                    { broadcastId: doc.id, providerId: syncResult.providerId },
                    'Broadcast synced to provider on UPDATE'
                  )

                  // Update document with provider IDs
                  // Using context flag to prevent this update from re-triggering the hook
                  await req.payload.update({
                    collection: collectionSlug,
                    id: doc.id,
                    data: {
                      providerId: syncResult.providerId,
                      externalId: syncResult.externalId,
                      providerData: syncResult.providerData,
                      providerSyncStatus: 'synced',
                      providerSyncError: null,
                      lastSyncAttempt: new Date().toISOString(),
                    },
                    context: { isSchedulingUpdate: true } as BroadcastHookContext,
                  })

                  return {
                    ...doc,
                    providerId: syncResult.providerId,
                    externalId: syncResult.externalId,
                    providerData: syncResult.providerData,
                    providerSyncStatus: 'synced',
                    providerSyncError: null,
                  }
                } else {
                  req.payload.logger.error(
                    { broadcastId: doc.id, error: syncResult.error },
                    'Failed to create broadcast in provider during UPDATE'
                  )
                  // Continue - don't block update, just log the error
                }
              }

              // If no providerId, skip sync
              if (!doc.providerId) {
                req.payload.logger.info(`Broadcast ${doc.id} has no providerId and insufficient content for creation - skipping sync`)
                return doc
              }

              // Handle normal updates to existing broadcasts (only if providerId exists)
              if (doc.providerId) {
                // Only sync if broadcast is still editable
                const capabilities = provider.getCapabilities()
                const sendStatus = doc.sendStatus || BroadcastStatus.DRAFT
                if (!capabilities.editableStatuses.includes(sendStatus)) {
                  req.payload.logger.info(`Skipping sync for broadcast in status: ${sendStatus}`)
                  return doc
                }

                // Check what has changed
                const contentChanged =
                  doc.subject !== previousDoc?.subject ||
                  doc.contentSection?.preheader !== previousDoc?.contentSection?.preheader ||
                  JSON.stringify(doc.contentSection?.content) !== JSON.stringify(previousDoc?.contentSection?.content) ||
                  doc.settings?.trackOpens !== previousDoc?.settings?.trackOpens ||
                  doc.settings?.trackClicks !== previousDoc?.settings?.trackClicks ||
                  doc.settings?.replyTo !== previousDoc?.settings?.replyTo ||
                  JSON.stringify(doc.audienceIds) !== JSON.stringify(previousDoc?.audienceIds)

                if (contentChanged) {
                  // Build update data with proper types
                  const updates: Partial<{
                    name: string
                    subject: string
                    preheader: string
                    content: string
                    trackOpens: boolean
                    trackClicks: boolean
                    replyTo: string
                    audienceIds: string[]
                  }> = {}
                  if (doc.subject !== previousDoc?.subject) {
                    updates.name = doc.subject // Use subject as name in the provider
                    updates.subject = doc.subject
                  }
                  if (doc.contentSection?.preheader !== previousDoc?.contentSection?.preheader) {
                    updates.preheader = doc.contentSection?.preheader
                  }
                  if (JSON.stringify(doc.contentSection?.content) !== JSON.stringify(previousDoc?.contentSection?.content)) {
                    const populatedContent = await populateMediaFields(doc.contentSection?.content, req.payload, pluginConfig) as SerializedEditorState | null

                    // Get email preview customization options
                    const emailPreviewConfig = pluginConfig.customizations?.broadcasts?.emailPreview

                    updates.content = await convertToEmailSafeHtml(populatedContent, {
                      wrapInTemplate: emailPreviewConfig?.wrapInTemplate ?? true,
                      customWrapper: emailPreviewConfig?.customWrapper,
                      preheader: doc.contentSection?.preheader,
                      subject: doc.subject,
                      documentData: doc, // Pass entire document
                      customBlockConverter: pluginConfig.customizations?.broadcasts?.customBlockConverter
                    })
                  }
                  if (doc.settings?.trackOpens !== previousDoc?.settings?.trackOpens) {
                    updates.trackOpens = doc.settings.trackOpens
                  }
                  if (doc.settings?.trackClicks !== previousDoc?.settings?.trackClicks) {
                    updates.trackClicks = doc.settings.trackClicks
                  }
                  if (doc.settings?.replyTo !== previousDoc?.settings?.replyTo) {
                    updates.replyTo = doc.settings.replyTo || providerConfig?.replyTo
                  }
                  if (JSON.stringify(doc.audienceIds) !== JSON.stringify(previousDoc?.audienceIds)) {
                    updates.audienceIds = (doc.audienceIds as AudienceIdField[] | undefined)?.map((a) => a.audienceId)
                  }

                  req.payload.logger.info({
                    providerId: doc.providerId,
                    updates
                  }, 'Syncing broadcast updates to provider')

                  await provider.update(doc.providerId, updates)

                  // Update sync status to synced
                  await req.payload.update({
                    collection: collectionSlug,
                    id: doc.id,
                    data: {
                      providerSyncStatus: 'synced',
                      providerSyncError: null,
                      lastSyncAttempt: new Date().toISOString(),
                    },
                    context: { isSchedulingUpdate: true } as BroadcastHookContext,
                  })

                  req.payload.logger.info(`Broadcast ${doc.id} synced to provider successfully`)
                } else {
                  req.payload.logger.info('No content changes to sync to provider')
                }
              }
            } catch (error: unknown) {
              req.payload.logger.error(
                {
                  broadcastId: doc.id,
                  subject: doc.subject,
                  error: getErrorDetails(error),
                },
                'Failed to sync broadcast to provider'
              )

              // Update sync status to failed so user can see the issue
              try {
                await req.payload.update({
                  collection: collectionSlug,
                  id: doc.id,
                  data: {
                    providerSyncStatus: 'failed',
                    providerSyncError: getErrorMessage(error),
                    lastSyncAttempt: new Date().toISOString(),
                  },
                  context: { isSchedulingUpdate: true } as BroadcastHookContext,
                })
              } catch (updateError) {
                req.payload.logger.error(
                  { broadcastId: doc.id, error: getErrorDetails(updateError) },
                  'Failed to update sync status after sync failure'
                )
              }
              // Don't throw - allow Payload update to succeed even if provider sync fails
            }
          }

          return doc
        },
        // Unified scheduling hook: syncs email scheduling with Payload publish scheduling
        async ({ doc, operation, previousDoc, req, context }): Promise<typeof doc> => {
          // Skip if this is an internal scheduling update (prevents recursion)
          const hookContext = context as BroadcastHookContext | undefined
          if (hookContext?.isSchedulingUpdate) {
            return doc
          }

          // Only process updates
          if (operation !== 'update') {
            return doc
          }

          // Skip if no providers configured
          if (!hasProviders) {
            return doc
          }

          // Cast to typed document for better type safety
          const broadcastDoc = doc as BroadcastDocument

          // Skip if no providerId (not synced to provider yet)
          if (!broadcastDoc.providerId) {
            return doc
          }

          // Skip if email-only (handled by ScheduleModal, not Payload's Schedule Publish)
          if (broadcastDoc.emailOnly === true) {
            return doc
          }

          // Skip if already sent or sending
          if (
            broadcastDoc.sendStatus === BroadcastStatus.SENT ||
            broadcastDoc.sendStatus === BroadcastStatus.SENDING
          ) {
            return doc
          }

          const transition = detectStateTransition(
            previousDoc as BroadcastDocument | undefined,
            broadcastDoc
          )

          const publishedAt = parseScheduledDate(broadcastDoc.publishedAt)
          const now = new Date()

          // --- IDEMPOTENCY CHECK ---
          // Skip if already scheduled for this exact time
          if (
            broadcastDoc.sendStatus === BroadcastStatus.SCHEDULED &&
            areScheduledTimesEqual(broadcastDoc.scheduledAt, publishedAt)
          ) {
            return doc
          }

          // --- PUBLISH TRANSITION ---
          if (transition.wasUnpublished && transition.isNowPublished) {
            try {
              const provider = await getBroadcastProvider(req, pluginConfig)

              // DECISION: Manual publish while scheduled = send immediately
              // This matches user intent - clicking "Publish" means "do it now"
              if (transition.isManualPublish) {
                req.payload.logger.info(
                  {
                    broadcastId: broadcastDoc.id,
                    action: 'manualPublishOverride',
                    scheduledFor: broadcastDoc.publishedAt,
                  },
                  'Manual publish detected, sending immediately instead of waiting for scheduled time'
                )
              }

              // Check if publishedAt is in the future AND not a manual publish
              if (publishedAt && publishedAt.getTime() > now.getTime() && !transition.isManualPublish) {
                // Future scheduled publish - schedule the email for that time
                const scheduleKey = generateIdempotencyKey(broadcastDoc.id, 'schedule', {
                  time: publishedAt.getTime(),
                })

                // Check if this exact schedule operation was recently completed
                // (prevents duplicate if DB update failed after provider success)
                const cached = getCompletedOperation(scheduleKey)
                if (cached) {
                  req.payload.logger.info(
                    { broadcastId: broadcastDoc.id, idempotencyKey: scheduleKey },
                    'Schedule operation already completed (idempotency check), updating local state only'
                  )
                } else {
                  // NOTE: provider.schedule() expects Date object, not string
                  await provider.schedule(broadcastDoc.providerId, publishedAt)
                  markOperationCompleted(scheduleKey, { scheduledAt: publishedAt.toISOString() })
                }

                await req.payload.update({
                  collection: 'broadcasts',
                  id: broadcastDoc.id,
                  data: scheduledState(publishedAt),
                  context: { isSchedulingUpdate: true } as BroadcastHookContext,
                })

                req.payload.logger.info(
                  {
                    broadcastId: broadcastDoc.id,
                    scheduledAt: publishedAt.toISOString(),
                  },
                  'Email scheduled to sync with website publish'
                )
              } else {
                // Immediate publish OR manual publish - send email now
                const sendKey = generateIdempotencyKey(broadcastDoc.id, 'send', {})

                // Check if this send operation was recently completed
                const cached = getCompletedOperation(sendKey)
                if (cached) {
                  req.payload.logger.info(
                    { broadcastId: broadcastDoc.id, idempotencyKey: sendKey },
                    'Send operation already completed (idempotency check), updating local state only'
                  )
                } else {
                  await provider.send(broadcastDoc.providerId)
                  markOperationCompleted(sendKey, { sentAt: new Date().toISOString() })
                }

                await req.payload.update({
                  collection: 'broadcasts',
                  id: broadcastDoc.id,
                  data: {
                    ...sendingState(),
                    sentAt: new Date().toISOString(),
                  },
                  context: { isSchedulingUpdate: true } as BroadcastHookContext,
                })

                req.payload.logger.info(
                  { broadcastId: broadcastDoc.id },
                  'Broadcast sent successfully on publish'
                )
              }
            } catch (error: unknown) {
              req.payload.logger.error(
                {
                  broadcastId: broadcastDoc.id,
                  error: getErrorDetails(error),
                },
                'Failed to schedule/send email for published broadcast'
              )

              await req.payload.update({
                collection: 'broadcasts',
                id: broadcastDoc.id,
                data: {
                  ...failedState(),
                  // Store error in webhookData.failureReason since we don't have a sendError field
                  webhookData: {
                    ...((doc as any).webhookData || {}),
                    failureReason: `Email operation failed: ${getErrorMessage(error)}`,
                  },
                },
                context: { isSchedulingUpdate: true } as BroadcastHookContext,
              })
              // Don't throw - website is already published
            }

            return doc
          }

          // --- SCHEDULE CANCELLATION ---
          if (
            transition.wasScheduled &&
            transition.isNoLongerScheduled &&
            broadcastDoc.sendStatus === BroadcastStatus.SCHEDULED
          ) {
            try {
              const provider = await getBroadcastProvider(req, pluginConfig)
              const cancelKey = generateIdempotencyKey(broadcastDoc.id, 'cancel', {})

              // Check if cancel was recently completed
              const cached = getCompletedOperation(cancelKey)
              if (cached) {
                req.payload.logger.info(
                  { broadcastId: broadcastDoc.id, idempotencyKey: cancelKey },
                  'Cancel operation already completed (idempotency check), updating local state only'
                )
              } else {
                await provider.cancelSchedule(broadcastDoc.providerId)
                markOperationCompleted(cancelKey, { cancelledAt: new Date().toISOString() })
              }

              await req.payload.update({
                collection: 'broadcasts',
                id: broadcastDoc.id,
                data: draftState(),
                context: { isSchedulingUpdate: true } as BroadcastHookContext,
              })

              req.payload.logger.info(
                { broadcastId: broadcastDoc.id },
                'Email schedule cancelled (publish schedule removed)'
              )
            } catch (error: unknown) {
              req.payload.logger.error(
                {
                  broadcastId: broadcastDoc.id,
                  error: getErrorDetails(error),
                },
                'Failed to cancel scheduled email - email may still send at original time'
              )
              // Don't update status - let user know the cancel may have failed
            }

            return doc
          }

          // --- SCHEDULE TIME CHANGE ---
          if (
            transition.scheduleTimeChanged &&
            publishedAt &&
            broadcastDoc.sendStatus === BroadcastStatus.SCHEDULED
          ) {
            try {
              const provider = await getBroadcastProvider(req, pluginConfig)
              const previousScheduledAt = broadcastDoc.scheduledAt

              // Use a compound idempotency key for reschedule (includes old and new time)
              const rescheduleKey = generateIdempotencyKey(broadcastDoc.id, 'schedule', {
                from: previousScheduledAt ? new Date(previousScheduledAt).getTime() : 0,
                to: publishedAt.getTime(),
              })

              // Check if this exact reschedule was recently completed
              const cached = getCompletedOperation(rescheduleKey)
              if (cached) {
                req.payload.logger.info(
                  { broadcastId: broadcastDoc.id, idempotencyKey: rescheduleKey },
                  'Reschedule operation already completed (idempotency check), updating local state only'
                )
              } else {
                // Cancel existing schedule, then create new one
                await provider.cancelSchedule(broadcastDoc.providerId)
                await provider.schedule(broadcastDoc.providerId, publishedAt)
                markOperationCompleted(rescheduleKey, {
                  rescheduledAt: new Date().toISOString(),
                  newTime: publishedAt.toISOString(),
                })
              }

              await req.payload.update({
                collection: 'broadcasts',
                id: broadcastDoc.id,
                data: {
                  scheduledAt: publishedAt.toISOString(),
                },
                context: { isSchedulingUpdate: true } as BroadcastHookContext,
              })

              req.payload.logger.info(
                {
                  broadcastId: broadcastDoc.id,
                  newScheduledAt: publishedAt.toISOString(),
                },
                'Email rescheduled to new publish time'
              )
            } catch (error: unknown) {
              req.payload.logger.error(
                {
                  broadcastId: broadcastDoc.id,
                  newScheduledAt: publishedAt.toISOString(),
                  error: getErrorDetails(error),
                },
                'Failed to reschedule email - may send at original time or not at all'
              )
            }

            return doc
          }

          return doc
        },
      ],
      // beforeChange hooks can be added here if needed
      beforeChange: [],
      // Handle deletion
      afterDelete: [
        async ({ doc, req }) => {
          if (!hasProviders || !doc?.providerId) return doc

          try {
            // Get provider (centralized initialization)
            const provider = await getBroadcastProvider(req, pluginConfig)

            // Only delete if broadcast is still editable
            const capabilities = provider.getCapabilities()
            if (capabilities.editableStatuses.includes(doc.sendStatus)) {
              await provider.delete(doc.providerId)
            }
          } catch (error) {
            // Log full error details for debugging
            if (error instanceof Error) {
              req.payload.logger.error('Failed to delete broadcast from provider:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                // If it's a BroadcastProviderError, it might have additional details
                ...(error as any).details
              })
            } else {
              req.payload.logger.error({ error: String(error) }, 'Failed to delete broadcast from provider')
            }
          }

          return doc
        },
      ],
    },
  }
}


