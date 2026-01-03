'use client'

import React from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { BroadcastScheduleButton } from './BroadcastScheduleButton'
import { CancelScheduleButton } from './CancelScheduleButton'

/**
 * Field component that shows scheduling controls based on broadcast status
 * Shows Schedule button for drafts, Cancel button for scheduled broadcasts
 */
export const BroadcastScheduleField: React.FC = () => {
  const { id } = useDocumentInfo()

  // Get field values from form state
  const sendStatusField = useFormFields(([fields]) => fields.sendStatus)
  const providerIdField = useFormFields(([fields]) => fields.providerId)
  const scheduledAtField = useFormFields(([fields]) => fields.scheduledAt)

  const sendStatus = sendStatusField?.value as string | undefined
  const providerId = providerIdField?.value as string | undefined
  const scheduledAt = scheduledAtField?.value as string | undefined

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

  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'var(--theme-elevation-50, #f9f9f9)',
        borderRadius: '4px',
      }}
    >
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
