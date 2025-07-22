'use client'

import React, { useState, useCallback } from 'react'
import type { RichTextField } from 'payload'
import { useField, useFormFields } from '@payloadcms/ui'
import { EmailPreview } from './EmailPreview'
import type { SerializedEditorState } from 'lexical'

interface BroadcastEditorProps {
  field: RichTextField
  path: string
}

export const BroadcastEditor: React.FC<BroadcastEditorProps> = (props) => {
  const { value } = useField<SerializedEditorState>({ path: props.path })
  const [showPreview, setShowPreview] = useState(true)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [isValid, setIsValid] = useState(true)
  const [validationSummary, setValidationSummary] = useState<string>('')

  // Get other form fields for preview
  const fields = useFormFields(([fields]) => ({
    subject: fields['subject'],
    preheader: fields['contentSection.preheader'],
  }))

  // Handle validation results from preview
  const handleValidation = useCallback((result: {
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
  }, [])

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
    <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
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
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            style={{
              padding: '6px 12px',
              backgroundColor: showPreview ? '#3b82f6' : '#e5e7eb',
              color: showPreview ? 'white' : '#374151',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>

          {/* Preview Mode */}
          {showPreview && (
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
          )}

          {/* Validation Status */}
          {showPreview && validationSummary && (
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
        {showPreview && (
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
        )}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor */}
        <div style={{ 
          flex: showPreview ? '0 0 50%' : '1',
          overflow: 'auto',
          borderRight: showPreview ? '1px solid #e5e7eb' : 'none',
        }}>
          <div style={{ padding: '16px' }}>
            {/* The actual rich text editor will be rendered by Payload */}
            {/* This component wraps it with preview functionality */}
            <div className="rich-text-lexical">
              {/* Payload will inject the editor here */}
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div style={{ flex: '0 0 50%', overflow: 'hidden' }}>
            <EmailPreview
              content={value}
              subject={fields.subject?.value as string || 'Email Subject'}
              preheader={fields.preheader?.value as string}
              mode={previewMode}
              onValidation={handleValidation}
            />
          </div>
        )}
      </div>
    </div>
  )
}