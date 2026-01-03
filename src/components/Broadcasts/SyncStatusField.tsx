'use client'

import React, { useState, useCallback } from 'react'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

/**
 * Field component that displays provider sync status with retry functionality.
 * Shows a warning banner when sync has failed and allows manual retry.
 */
export const SyncStatusField: React.FC = () => {
  const { id } = useDocumentInfo()
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryResult, setRetryResult] = useState<{ success: boolean; message: string } | null>(null)

  // Get field values from form state
  const syncStatusField = useFormFields(([fields]) => fields.providerSyncStatus)
  const syncErrorField = useFormFields(([fields]) => fields.providerSyncError)
  const lastSyncField = useFormFields(([fields]) => fields.lastSyncAttempt)

  const syncStatus = syncStatusField?.value as string | undefined
  const syncError = syncErrorField?.value as string | undefined
  const lastSyncAttempt = lastSyncField?.value as string | undefined

  const handleRetrySync = useCallback(async () => {
    if (!id) return

    setIsRetrying(true)
    setRetryResult(null)

    try {
      const response = await fetch(`/api/broadcasts/${id}/retry-sync`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setRetryResult({ success: true, message: 'Sync successful! Refreshing...' })
        // Refresh the page to show updated status
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setRetryResult({ success: false, message: data.error || 'Retry failed' })
      }
    } catch (err) {
      setRetryResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setIsRetrying(false)
    }
  }, [id])

  // Format last sync time
  const formattedLastSync = lastSyncAttempt
    ? new Date(lastSyncAttempt).toLocaleString()
    : null

  // Pending state - show neutral info
  if (syncStatus === 'pending' || !syncStatus) {
    return (
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--theme-elevation-100, #f5f5f5)',
          borderRadius: '4px',
          fontSize: '14px',
          color: 'var(--theme-elevation-600, #666)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⏳</span>
          <span>Pending sync with email provider</span>
        </div>
        <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--theme-elevation-500, #888)' }}>
          Save the broadcast with content to sync with the provider.
        </div>
      </div>
    )
  }

  // Synced state - show success
  if (syncStatus === 'synced') {
    return (
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--theme-success-100, #dcfce7)',
          borderRadius: '4px',
          fontSize: '14px',
          color: 'var(--theme-success-700, #15803d)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>✓</span>
          <span>Synced with email provider</span>
        </div>
        {formattedLastSync && (
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
            Last synced: {formattedLastSync}
          </div>
        )}
      </div>
    )
  }

  // Failed state - show error with retry button
  if (syncStatus === 'failed') {
    return (
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--theme-error-100, #fef2f2)',
          borderRadius: '4px',
          fontSize: '14px',
          border: '1px solid var(--theme-error-200, #fecaca)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--theme-error-700, #b91c1c)',
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: '16px' }}>⚠</span>
          <span>Sync failed</span>
        </div>

        {syncError && (
          <div
            style={{
              fontSize: '13px',
              marginTop: '8px',
              padding: '8px',
              backgroundColor: 'var(--theme-error-50, #fff5f5)',
              borderRadius: '4px',
              color: 'var(--theme-error-600, #dc2626)',
              fontFamily: 'monospace',
              wordBreak: 'break-word',
            }}
          >
            {syncError}
          </div>
        )}

        {formattedLastSync && (
          <div
            style={{
              fontSize: '12px',
              marginTop: '8px',
              color: 'var(--theme-elevation-500, #888)',
            }}
          >
            Last attempt: {formattedLastSync}
          </div>
        )}

        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleRetrySync}
            disabled={isRetrying}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'var(--theme-elevation-800, #333)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              opacity: isRetrying ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isRetrying ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>↻</span>
                Retrying...
              </>
            ) : (
              <>
                <span>↻</span>
                Retry Sync
              </>
            )}
          </button>

          {retryResult && (
            <span
              style={{
                fontSize: '13px',
                color: retryResult.success
                  ? 'var(--theme-success-600, #16a34a)'
                  : 'var(--theme-error-600, #dc2626)',
              }}
            >
              {retryResult.message}
            </span>
          )}
        </div>

        <div
          style={{
            fontSize: '12px',
            marginTop: '8px',
            color: 'var(--theme-elevation-500, #888)',
          }}
        >
          The email content may be out of sync with the provider. Try saving again or click Retry.
        </div>
      </div>
    )
  }

  // Unknown status
  return (
    <div
      style={{
        padding: '12px 16px',
        backgroundColor: 'var(--theme-elevation-100, #f5f5f5)',
        borderRadius: '4px',
        fontSize: '14px',
        color: 'var(--theme-elevation-600, #666)',
      }}
    >
      Status: {syncStatus || 'unknown'}
    </div>
  )
}
