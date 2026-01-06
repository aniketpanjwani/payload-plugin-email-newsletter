'use client'

import React, { useState, useCallback } from 'react'
import { useFormFields } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'

export const BroadcastInlinePreview: UIFieldClientComponent = () => {
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use useFormFields to access ALL form data, not just local field data
  const fields = useFormFields(([fields]) => fields)

  const generatePreview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Debug: log available field keys to understand structure
      console.log('[BroadcastPreview] Available field keys:', Object.keys(fields || {}))

      // Access content using the flattened field name
      // Payload flattens nested fields with dot notation
      // Try multiple possible paths since structure may vary
      const contentField = fields?.['contentSection.content']
        || fields?.['content']
        || fields?.['contentSection']?.value?.content
      const contentValue = contentField?.value || contentField

      console.log('[BroadcastPreview] Content field:', contentField)
      console.log('[BroadcastPreview] Content value:', contentValue ? 'exists' : 'missing')

      if (!contentValue) {
        setError('No content available to preview. Check console for field structure.')
        setLoading(false)
        return
      }

      // Build document data from all fields
      const documentData: Record<string, any> = {}
      Object.entries(fields || {}).forEach(([key, field]) => {
        // Skip complex fields that might cause serialization issues
        if (field && typeof field === 'object' && 'value' in field) {
          documentData[key] = field.value
        }
      })

      const response = await fetch('/api/broadcasts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: contentValue,
          documentData, // Pass all form data
        }),
      })

      if (!response.ok) {
        throw new Error(`Preview failed: ${response.statusText}`)
      }

      const data = await response.json()
      setPreview(data.html || '')
      setShowPreview(true)
    } catch (err) {
      console.error('Preview generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setLoading(false)
    }
  }, [fields])

  return (
    <div className="field-type">
      <div className="field-label">Email Preview</div>
      
      {!showPreview ? (
        <div className="preview-controls">
          <button
            type="button"
            onClick={generatePreview}
            disabled={loading}
            className="btn btn--style-primary btn--icon-style-without-border btn--size-small"
            style={{ marginBottom: '1rem' }}
          >
            {loading ? 'Generating Preview...' : 'Generate Preview'}
          </button>
          
          {error && (
            <div className="error-message" style={{ color: '#dc2626', marginTop: '0.5rem' }}>
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="preview-controls" style={{ marginBottom: '1rem' }}>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="btn btn--style-secondary btn--icon-style-without-border btn--size-small"
              style={{ marginRight: '0.5rem' }}
            >
              Hide Preview
            </button>
            <button
              type="button"
              onClick={generatePreview}
              disabled={loading}
              className="btn btn--style-primary btn--icon-style-without-border btn--size-small"
            >
              {loading ? 'Regenerating...' : 'Refresh Preview'}
            </button>
          </div>
          
          <div className="email-preview-container">
            <iframe
              srcDoc={preview}
              style={{
                width: '100%',
                height: '600px',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                backgroundColor: 'white',
              }}
              title="Email Preview"
            />
          </div>
        </>
      )}
    </div>
  )
}

// Export type for compatibility
export interface BroadcastInlinePreviewProps {
  data?: any
  field?: any
  path?: string
  schemaPath?: string
}