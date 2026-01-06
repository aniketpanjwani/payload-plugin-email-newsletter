'use client'

import React, { useState, useCallback } from 'react'
import { useDocumentForm } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'

export const BroadcastInlinePreview: UIFieldClientComponent = () => {
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Use getData and getFields methods (action-based, not deprecated fields property)
  const { getData, getFields } = useDocumentForm()

  const generatePreview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Use getData() to get current form data (action-based, always up-to-date)
      const formData = getData()
      console.log('[BroadcastPreview] Form data from getData():', formData)

      // Also try getFields for debugging
      const fields = getFields()
      console.log('[BroadcastPreview] Fields from getFields():', fields)
      console.log('[BroadcastPreview] Field keys:', Object.keys(fields || {}))

      // Try to get content from various possible locations
      const content = formData?.contentSection?.content
        || formData?.content
        || (fields as any)?.['contentSection.content']?.value
        || (fields as any)?.['content']?.value

      console.log('[BroadcastPreview] Content found:', content ? 'yes' : 'no')

      if (!content) {
        setError('No content available to preview. Check console for field structure.')
        setLoading(false)
        return
      }

      const response = await fetch('/api/broadcasts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          documentData: formData,
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
  }, [getData, getFields])

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
