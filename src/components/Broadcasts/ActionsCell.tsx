'use client'

import React, { useState } from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { BroadcastStatus } from '../../types'
import { SendBroadcastModal } from './SendBroadcastModal'
// Using basic alerts for now - can be replaced with Payload's toast when available

interface BroadcastDoc {
  id: string
  status: BroadcastStatus
  name: string
  subject: string
  providerId?: string
  channel?: {
    id: string
    name: string
    providerType: 'broadcast' | 'resend'
  }
}

export const ActionsCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const [loading, setLoading] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const broadcast = rowData as BroadcastDoc

  const handleSend = () => {
    if (!broadcast.providerId) {
      alert('This broadcast has not been synced with the provider yet')
      return
    }
    setShowSendModal(true)
  }

  const handleSchedule = () => {
    if (!broadcast.providerId) {
      alert('This broadcast has not been synced with the provider yet')
      return
    }
    // Open the send modal in schedule mode
    setShowSendModal(true)
  }

  const handleDuplicate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/broadcasts/${broadcast.id}`)
      const data = await response.json()
      
      // Remove fields that should not be duplicated
      delete data.id
      delete data.createdAt
      delete data.updatedAt
      delete data.providerId
      delete data.sentAt
      delete data.scheduledAt
      delete data.analytics
      
      // Update the name and status
      data.name = `${data.name} (Copy)`
      data.status = BroadcastStatus.DRAFT
      
      // Create the duplicate
      const createResponse = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!createResponse.ok) {
        throw new Error('Failed to duplicate broadcast')
      }

      alert('Broadcast duplicated successfully')
      window.location.reload()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to duplicate broadcast')
    } finally {
      setLoading(false)
    }
  }

  const canSend = broadcast.status === BroadcastStatus.DRAFT
  const canSchedule = broadcast.status === BroadcastStatus.DRAFT
  const canDuplicate = true
  const canDelete = broadcast.status === BroadcastStatus.DRAFT

  return (
    <>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {canSend && (
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: '4px 12px',
            backgroundColor: '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Send
        </button>
      )}
      
      {canSchedule && (
        <button
          onClick={handleSchedule}
          disabled={loading}
          style={{
            padding: '4px 12px',
            backgroundColor: '#6366F1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Schedule
        </button>
      )}
      
      {canDuplicate && (
        <button
          onClick={handleDuplicate}
          disabled={loading}
          style={{
            padding: '4px 12px',
            backgroundColor: '#6B7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Duplicate
        </button>
      )}
    </div>
    
    {/* Send/Schedule Modal */}
    {showSendModal && (
      <SendBroadcastModal
        broadcast={broadcast}
        onClose={() => setShowSendModal(false)}
        onSuccess={() => {
          setShowSendModal(false)
          // Refresh the page to update the status
          window.location.reload()
        }}
      />
    )}
  </>
  )
}