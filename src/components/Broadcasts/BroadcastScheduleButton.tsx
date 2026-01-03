'use client'

import React, { useState } from 'react'
import { ScheduleModal } from './ScheduleModal'

export interface BroadcastScheduleButtonProps {
  broadcastId: string
  sendStatus?: string
  providerId?: string
}

/**
 * Button to open the schedule modal for a broadcast
 * Only shows for draft broadcasts that have been synced to the provider
 */
export const BroadcastScheduleButton: React.FC<BroadcastScheduleButtonProps> = ({
  broadcastId,
  sendStatus = 'draft',
  providerId,
}) => {
  const [showModal, setShowModal] = useState(false)

  // Only show for drafts that have a providerId
  if (sendStatus !== 'draft') {
    return null
  }

  // If no providerId, show disabled button with tooltip
  if (!providerId) {
    return (
      <button
        disabled
        title="Save the broadcast first to sync with the email provider"
        style={{
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: 'var(--theme-elevation-200, #ccc)',
          color: 'var(--theme-elevation-500, #666)',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'not-allowed',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>📅</span>
        Schedule (save first)
      </button>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          backgroundColor: 'var(--theme-success-500, #22c55e)',
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span>📅</span>
        Schedule Send
      </button>

      {showModal && (
        <ScheduleModal
          broadcastId={broadcastId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
