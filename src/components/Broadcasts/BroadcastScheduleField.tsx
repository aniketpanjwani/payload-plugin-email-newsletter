'use client'

import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { BroadcastScheduleButton } from './BroadcastScheduleButton'
import { CancelScheduleButton } from './CancelScheduleButton'

/**
 * Field component that shows scheduling controls based on broadcast status
 *
 * For email-only broadcasts: Shows Schedule button for drafts, Cancel button for scheduled
 * For website broadcasts: Shows informational message about unified scheduling via Payload's Schedule Publish
 */
export const BroadcastScheduleField: React.FC = () => {
  const { id } = useDocumentInfo()

  // Get field values from form state
  const sendStatusField = useFormFields(([fields]) => fields.sendStatus)
  const providerIdField = useFormFields(([fields]) => fields.providerId)
  const scheduledAtField = useFormFields(([fields]) => fields.scheduledAt)
  const emailOnlyField = useFormFields(([fields]) => fields.emailOnly)

  const sendStatus = sendStatusField?.value as string | undefined
  const providerId = providerIdField?.value as string | undefined
  const scheduledAt = scheduledAtField?.value as string | undefined
  const emailOnly = emailOnlyField?.value as boolean | undefined

  // Don't render if no document ID (new document)
  if (!id) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--theme-elevation-50, #f9f9f9)',
          borderRadius: '4px',
          fontSize: '14px',
          color: 'var(--theme-elevation-600, #666)',
        }}
      >
        Save the broadcast to enable scheduling options.
      </div>
    )
  }

  // Already sent or sending - show readonly status
  if (sendStatus === 'sent' || sendStatus === 'sending') {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--theme-elevation-50, #f9f9f9)',
          borderRadius: '4px',
          fontSize: '14px',
          color: 'var(--theme-elevation-600, #666)',
        }}
      >
        {sendStatus === 'sent'
          ? 'This broadcast has been sent and cannot be rescheduled.'
          : 'This broadcast is currently being sent.'}
      </div>
    )
  }

  // Failed broadcasts can potentially be rescheduled
  if (sendStatus === 'failed') {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--theme-error-100, #fef2f2)',
          borderRadius: '4px',
          fontSize: '14px',
          color: 'var(--theme-error-600, #dc2626)',
        }}
      >
        This broadcast failed to send. Edit and save to return it to draft status.
      </div>
    )
  }

  // NON-EMAIL-ONLY: Show unified scheduling info
  // These broadcasts use Payload's built-in Schedule Publish feature
  if (!emailOnly) {
    return (
      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--theme-elevation-50, #f9f9f9)',
          borderRadius: '4px',
        }}
      >
        <div style={{ marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
          Email Scheduling
        </div>
        {sendStatus === 'scheduled' && scheduledAt ? (
          <div style={{ fontSize: '14px', color: 'var(--theme-elevation-600, #666)' }}>
            <div style={{ marginBottom: '8px' }}>
              ✓ Email scheduled to send:{' '}
              <strong>{new Date(scheduledAt).toLocaleString()}</strong>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--theme-elevation-500, #888)' }}>
              This email will be sent when the website publish time is reached.
              To change the time, use the &quot;Schedule Publish&quot; button in the sidebar.
              To cancel, remove the scheduled publish date.
            </div>
          </div>
        ) : sendStatus === 'draft' ? (
          <div style={{ fontSize: '14px', color: 'var(--theme-elevation-600, #666)' }}>
            <div style={{ marginBottom: '8px' }}>
              Use Payload&apos;s <strong>Schedule Publish</strong> feature (in the sidebar) to
              schedule both the website publish and email send together.
            </div>
            <div style={{ fontSize: '13px', color: 'var(--theme-elevation-500, #888)' }}>
              • Click &quot;Publish&quot; to publish the website and send the email immediately
              <br />• Click &quot;Schedule Publish&quot; to schedule both for a future date/time
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: 'var(--theme-elevation-600, #666)' }}>
            Status: {sendStatus || 'unknown'}
          </div>
        )}
      </div>
    )
  }

  // EMAIL-ONLY: Show the schedule/cancel buttons
  // These broadcasts don't publish to website, so use the custom scheduling UI
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'var(--theme-elevation-50, #f9f9f9)',
        borderRadius: '4px',
      }}
    >
      <div style={{ marginBottom: '8px', fontWeight: 500, fontSize: '14px' }}>
        Email-Only Scheduling
      </div>
      {sendStatus === 'scheduled' ? (
        <CancelScheduleButton
          broadcastId={String(id)}
          sendStatus={sendStatus}
          scheduledAt={scheduledAt}
        />
      ) : (
        <BroadcastScheduleButton
          broadcastId={String(id)}
          sendStatus={sendStatus}
          providerId={providerId}
        />
      )}
    </div>
  )
}
