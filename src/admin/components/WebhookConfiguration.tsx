'use client'

import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui'
import { toast } from '@payloadcms/ui'

export const WebhookConfiguration: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false)
  const [verifying, setVerifying] = useState(false)
  
  const fields = useFormFields(([fields]) => ({
    webhookUrl: (fields?.broadcastSettings as any)?.webhookUrl as string | undefined,
    webhookStatus: (fields?.broadcastSettings as any)?.webhookStatus as string | undefined,
    lastWebhookReceived: (fields?.broadcastSettings as any)?.lastWebhookReceived as string | undefined,
  }))
  
  const handleVerify = async () => {
    setVerifying(true)
    
    try {
      const response = await fetch('/api/newsletter/webhooks/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message || 'Webhook verified')
      } else {
        toast.error(data.error || 'Verification failed')
      }
    } catch {
      toast.error('Failed to verify webhook')
    } finally {
      setVerifying(false)
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'green'
      case 'configured':
        return 'yellow'
      case 'error':
        return 'red'
      default:
        return 'gray'
    }
  }
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified ✓'
      case 'configured':
        return 'Configured'
      case 'error':
        return 'Error'
      default:
        return 'Not Configured'
    }
  }
  
  return (
    <div className="field-type">
      <div style={{ marginBottom: '1rem' }}>
        <label className="field-label">Webhook Configuration</label>
        
        <div style={{ 
          background: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '4px',
          marginTop: '0.5rem' 
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Webhook URL:</strong>
            <code style={{ 
              display: 'block', 
              padding: '0.5rem', 
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginTop: '0.25rem',
              fontSize: '0.875rem'
            }}>
              {fields.webhookUrl || 'Save settings to generate URL'}
            </code>
          </div>
          
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Status:</strong>{' '}
            <span style={{ color: getStatusColor(fields.webhookStatus || 'not_configured') }}>
              {getStatusLabel(fields.webhookStatus || 'not_configured')}
            </span>
          </div>
          
          {fields.lastWebhookReceived && (
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              Last event: {new Date(fields.lastWebhookReceived).toLocaleString()}
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <Button
            onClick={() => setShowInstructions(!showInstructions)}
            buttonStyle="secondary"
            size="small"
          >
            {showInstructions ? 'Hide' : 'Show'} Instructions
          </Button>
          
          <Button
            onClick={handleVerify}
            buttonStyle="primary"
            size="small"
            disabled={verifying || !fields.webhookUrl}
          >
            {verifying ? 'Verifying...' : 'Verify Webhook'}
          </Button>
        </div>
        
        {showInstructions && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            background: '#f0f8ff',
            border: '1px solid #b0d4ff',
            borderRadius: '4px'
          }}>
            <h4 style={{ marginTop: 0 }}>Configure Broadcast Webhook</h4>
            <ol>
              <li>Copy the webhook URL above</li>
              <li>Go to your Broadcast dashboard</li>
              <li>Navigate to "Webhook Endpoints"</li>
              <li>Click "Add Webhook Endpoint"</li>
              <li>Paste the URL</li>
              <li>Select these events:
                <ul>
                  <li>Subscriber Events: subscribed, unsubscribed</li>
                  <li>Broadcast Events: All</li>
                </ul>
              </li>
              <li>Click "Create Webhook"</li>
              <li>Copy the webhook secret shown</li>
              <li>Paste it in the Webhook Secret field below</li>
              <li>Save these settings</li>
              <li>Click "Verify Webhook" to test the connection</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}