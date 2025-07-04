'use client'

import React, { useState } from 'react'
import { useFormFields } from '@payloadcms/ui'
import { EmailPreview } from './EmailPreview'
import type { SerializedEditorState } from 'lexical'
import type { Channel } from '../../types'

export const EmailPreviewField: React.FC = () => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isValid, setIsValid] = useState(true)
  const [validationSummary, setValidationSummary] = useState<string>('')

  // Get form fields for preview
  const fields = useFormFields(([fields]) => ({
    content: fields.content,
    subject: fields.subject,
    preheader: fields.preheader,
    channel: fields.channel,
  }))

  // Handle validation results from preview
  const handleValidation = (result: {
    valid: boolean
    warnings: string[]
    errors: string[]
  }) => {
    setIsValid(result.valid)
    
    const errorCount = result.errors.length
    const warningCount = result.warnings.length
    
    if (errorCount > 0) {
      setValidationSummary(`${errorCount} error${errorCount !== 1 ? 's' : ''}, ${warningCount} warning${warningCount !== 1 ? 's' : ''}`)
    } else if (warningCount > 0) {
      setValidationSummary(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`)
    } else {
      setValidationSummary('')
    }
  }

  // Test email handler
  const handleTestEmail = async () => {
    // Get the current form ID from the URL
    const pathParts = window.location.pathname.split('/')
    const broadcastId = pathParts[pathParts.length - 1]
    
    if (!broadcastId || broadcastId === 'create') {
      alert('Please save the broadcast before sending a test email')
      return
    }

    try {
      const response = await fetch(`/api/broadcasts/${broadcastId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send test email')
      }

      alert('Test email sent successfully! Check your inbox.')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send test email')
    }
  }

  return (
    <div style={{
      marginTop: '24px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Email Preview</h3>

          {/* Preview Mode */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              style={{
                padding: '6px 12px',
                backgroundColor: previewMode === 'desktop' ? '#6366f1' : '#e5e7eb',
                color: previewMode === 'desktop' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '4px 0 0 4px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              style={{
                padding: '6px 12px',
                backgroundColor: previewMode === 'mobile' ? '#6366f1' : '#e5e7eb',
                color: previewMode === 'mobile' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '0 4px 4px 0',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Mobile
            </button>
          </div>

          {/* Validation Status */}
          {validationSummary && (
            <div style={{
              padding: '6px 12px',
              backgroundColor: isValid ? '#fef3c7' : '#fee2e2',
              color: isValid ? '#92400e' : '#991b1b',
              borderRadius: '4px',
              fontSize: '13px',
            }}>
              {validationSummary}
            </div>
          )}
        </div>

        {/* Test Email Button */}
        <button
          type="button"
          onClick={handleTestEmail}
          style={{
            padding: '6px 12px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Send Test Email
        </button>
      </div>

      {/* Preview */}
      <div style={{ height: '600px' }}>
        <EmailPreview
          content={fields.content?.value as SerializedEditorState || null}
          subject={fields.subject?.value as string || 'Email Subject'}
          preheader={fields.preheader?.value as string}
          channel={fields.channel?.value as Channel | null}
          mode={previewMode}
          onValidation={handleValidation}
        />
      </div>
    </div>
  )
}