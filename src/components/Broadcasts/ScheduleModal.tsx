'use client'

import React, { useState, useCallback } from 'react'

export interface ScheduleModalProps {
  broadcastId: string
  onScheduled?: () => void
  onClose: () => void
}

/**
 * Modal for scheduling a broadcast
 * Uses native HTML date-time inputs for compatibility
 */
export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  broadcastId,
  onScheduled,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Get minimum time (if today is selected)
  const getMinTime = () => {
    if (!selectedDate) return undefined
    const today = new Date()
    const selectedDateObj = new Date(selectedDate)
    if (selectedDateObj.toDateString() === today.toDateString()) {
      // Add 5 minutes buffer
      const minTime = new Date(today.getTime() + 5 * 60 * 1000)
      return `${String(minTime.getHours()).padStart(2, '0')}:${String(minTime.getMinutes()).padStart(2, '0')}`
    }
    return undefined
  }

  const handleSchedule = useCallback(async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Combine date and time into ISO string
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)

      // Validate it's in the future
      if (scheduledAt <= new Date()) {
        setError('Scheduled time must be in the future')
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/broadcasts/${broadcastId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
          timezone,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to schedule broadcast')
        return
      }

      // Success - call callback and close
      onScheduled?.()
      onClose()
      // Refresh the page to show updated status
      window.location.reload()
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, selectedTime, timezone, broadcastId, onScheduled, onClose])

  // Common timezones for quick selection
  const commonTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney',
  ]

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--theme-elevation-0, #fff)',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        <h2
          style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--theme-elevation-1000, #000)',
          }}
        >
          Schedule Broadcast
        </h2>

        {error && (
          <div
            style={{
              padding: '12px',
              marginBottom: '16px',
              backgroundColor: 'var(--theme-error-100, #fef2f2)',
              color: 'var(--theme-error-500, #ef4444)',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--theme-elevation-800, #333)',
            }}
          >
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--theme-elevation-150, #ddd)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--theme-input-bg, #fff)',
              color: 'var(--theme-elevation-1000, #000)',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--theme-elevation-800, #333)',
            }}
          >
            Time
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            min={getMinTime()}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--theme-elevation-150, #ddd)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--theme-input-bg, #fff)',
              color: 'var(--theme-elevation-1000, #000)',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '4px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--theme-elevation-800, #333)',
            }}
          >
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid var(--theme-elevation-150, #ddd)',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'var(--theme-input-bg, #fff)',
              color: 'var(--theme-elevation-1000, #000)',
            }}
          >
            {commonTimezones.includes(timezone) ? null : (
              <option value={timezone}>{timezone}</option>
            )}
            {commonTimezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              border: '1px solid var(--theme-elevation-150, #ddd)',
              borderRadius: '4px',
              backgroundColor: 'transparent',
              color: 'var(--theme-elevation-800, #333)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={isLoading || !selectedDate || !selectedTime}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: isLoading || !selectedDate || !selectedTime
                ? 'var(--theme-elevation-200, #ccc)'
                : 'var(--theme-success-500, #22c55e)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isLoading || !selectedDate || !selectedTime ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}
