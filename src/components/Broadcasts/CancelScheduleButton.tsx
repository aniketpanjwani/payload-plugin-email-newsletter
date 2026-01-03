'use client'

import React, { useState, useCallback } from 'react'
import { BroadcastStatus } from '../../types/broadcast'

export interface CancelScheduleButtonProps {
  broadcastId: string
  sendStatus?: string
  scheduledAt?: string
}

/**
 * Button to cancel a scheduled broadcast
 * Only shows for broadcasts with 'scheduled' status
 */
export const CancelScheduleButton: React.FC<CancelScheduleButtonProps> = ({
  broadcastId,
  sendStatus = BroadcastStatus.DRAFT,
  scheduledAt,
}) => {
  const [isLoading, setIsLoading] = useState(false)

  // Only show for scheduled broadcasts
  if (sendStatus !== BroadcastStatus.SCHEDULED) {
    return null
  }

  const handleCancel = useCallback(async () => {
    const formattedDate = scheduledAt
      ? new Date(scheduledAt).toLocaleString()
      : 'unknown time'

    const confirmed = window.confirm(
      `Are you sure you want to cancel this scheduled broadcast?\n\nIt was scheduled for: ${formattedDate}\n\nThe broadcast will be returned to draft status.`
    )

    if (!confirmed) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/broadcasts/${broadcastId}/schedule`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!data.success) {
        alert(data.error || 'Failed to cancel schedule')
        return
      }

      // Refresh the page to show updated status
      window.location.reload()
    } catch (err) {
      alert('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [broadcastId, scheduledAt])

  // Format scheduled time for display
  const formattedScheduledAt = scheduledAt
    ? new Date(scheduledAt).toLocaleString()
    : null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      {formattedScheduledAt && (
        <span
          style={{
            fontSize: '14px',
            color: 'var(--theme-elevation-600, #666)',
          }}
        >
          Scheduled for: <strong>{formattedScheduledAt}</strong>
        </span>
      )}
      <button
        onClick={handleCancel}
        disabled={isLoading}
        style={{
          padding: '8px 16px',
          border: '1px solid var(--theme-error-500, #ef4444)',
          borderRadius: '4px',
          backgroundColor: 'transparent',
          color: 'var(--theme-error-500, #ef4444)',
          fontSize: '14px',
          fontWeight: '500',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        <span>✕</span>
        {isLoading ? 'Cancelling...' : 'Cancel Schedule'}
      </button>
    </div>
  )
}
