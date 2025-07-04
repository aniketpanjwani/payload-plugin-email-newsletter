'use client'

import React, { useState, useEffect } from 'react'

interface SendBroadcastModalProps {
  broadcast: {
    id: string
    name: string
    subject: string
    channel?: {
      id: string
      name: string
      providerType: 'broadcast' | 'resend'
    }
  }
  onClose: () => void
  onSuccess: () => void
}

interface Audience {
  id: string
  name: string
  subscriberCount: number
}

export const SendBroadcastModal: React.FC<SendBroadcastModalProps> = ({ 
  broadcast, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([])
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [providerCapabilities, setProviderCapabilities] = useState<any>(null)
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now')
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [scheduledTime, setScheduledTime] = useState<string>('')

  // Fetch available audiences and provider capabilities
  useEffect(() => {
    const fetchData = async () => {
      try {
        // For now, we'll use mock data since audience endpoints aren't implemented yet
        // In the future, this would fetch from /api/channels/:channelId/audiences
        setAudiences([
          { id: 'all', name: 'All Subscribers', subscriberCount: 1000 },
          { id: 'active', name: 'Active Subscribers', subscriberCount: 850 },
        ])

        // Check provider capabilities (scheduling support)
        if (broadcast.channel?.providerType === 'broadcast') {
          setProviderCapabilities({ supportsScheduling: true })
        } else {
          setProviderCapabilities({ supportsScheduling: false })
        }
      } catch (err) {
        console.error('Failed to fetch modal data:', err)
      }
    }

    fetchData()
  }, [broadcast.channel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (sendMode === 'now') {
        // Send immediately
        const response = await fetch(`/api/broadcasts/${broadcast.id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audienceIds: selectedAudiences.length > 0 ? selectedAudiences : undefined,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to send broadcast')
        }

        alert(`Broadcast "${broadcast.name}" has been sent successfully`)
      } else {
        // Schedule for later
        if (!scheduledDate || !scheduledTime) {
          throw new Error('Please select both date and time for scheduling')
        }

        const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString()

        const response = await fetch(`/api/broadcasts/${broadcast.id}/schedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scheduledAt,
            audienceIds: selectedAudiences.length > 0 ? selectedAudiences : undefined,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to schedule broadcast')
        }

        alert(`Broadcast "${broadcast.name}" has been scheduled successfully`)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAudienceToggle = (audienceId: string) => {
    setSelectedAudiences(prev =>
      prev.includes(audienceId)
        ? prev.filter(id => id !== audienceId)
        : [...prev, audienceId]
    )
  }

  // Set minimum date/time to current
  const now = new Date()
  const minDate = now.toISOString().split('T')[0]
  const minTime = now.toTimeString().slice(0, 5)

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '24px' }}>
          Send Broadcast: {broadcast.name}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Send Mode Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              When to send:
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="now"
                  checked={sendMode === 'now'}
                  onChange={(e) => setSendMode(e.target.value as 'now')}
                  style={{ marginRight: '8px' }}
                />
                Send Now
              </label>
              {providerCapabilities?.supportsScheduling && (
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="schedule"
                    checked={sendMode === 'schedule'}
                    onChange={(e) => setSendMode(e.target.value as 'schedule')}
                    style={{ marginRight: '8px' }}
                  />
                  Schedule for Later
                </label>
              )}
            </div>
          </div>

          {/* Schedule Date/Time */}
          {sendMode === 'schedule' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Schedule Date & Time:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={minDate}
                  required={sendMode === 'schedule'}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    flex: 1,
                  }}
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  min={scheduledDate === minDate ? minTime : undefined}
                  required={sendMode === 'schedule'}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    flex: 1,
                  }}
                />
              </div>
            </div>
          )}

          {/* Audience Selection */}
          {audiences.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                Target Audiences (optional):
              </label>
              <div style={{ 
                border: '1px solid #D1D5DB', 
                borderRadius: '4px', 
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {audiences.map(audience => (
                  <label
                    key={audience.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      borderBottom: '1px solid #E5E7EB',
                      cursor: 'pointer',
                      backgroundColor: selectedAudiences.includes(audience.id) ? '#F3F4F6' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAudiences.includes(audience.id)}
                      onChange={() => handleAudienceToggle(audience.id)}
                      style={{ marginRight: '12px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{audience.name}</div>
                      <div style={{ fontSize: '14px', color: '#6B7280' }}>
                        {audience.subscriberCount.toLocaleString()} subscribers
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedAudiences.length === 0 && (
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>
                  If no audiences are selected, the broadcast will be sent to all subscribers.
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          <div style={{
            backgroundColor: '#F3F4F6',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '24px',
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '8px' }}>Summary</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              <strong>Subject:</strong> {broadcast.subject}<br />
              <strong>Channel:</strong> {broadcast.channel?.name || 'Unknown'}<br />
              <strong>Provider:</strong> {broadcast.channel?.providerType || 'Unknown'}<br />
              <strong>When:</strong> {sendMode === 'now' ? 'Immediately' : `${scheduledDate} at ${scheduledTime}`}<br />
              {selectedAudiences.length > 0 && (
                <>
                  <strong>Audiences:</strong> {selectedAudiences.length} selected
                </>
              )}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#DC2626',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '24px',
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '8px 24px',
                backgroundColor: '#E5E7EB',
                color: '#1F2937',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 24px',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Processing...' : (sendMode === 'now' ? 'Send Now' : 'Schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}