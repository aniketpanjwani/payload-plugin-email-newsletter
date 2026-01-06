'use client'

import React, { useState, useCallback, useEffect } from 'react'
import type { UIFieldClientComponent } from 'payload'

export const BroadcastInlinePreview: UIFieldClientComponent = () => {
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [documentId, setDocumentId] = useState<string | null>(null)

  // Extract document ID from URL on mount
  useEffect(() => {
    // URL pattern: /admin/collections/broadcasts/:id
    const pathParts = window.location.pathname.split('/')
    const broadcastsIndex = pathParts.indexOf('broadcasts')
    if (broadcastsIndex !== -1 && pathParts[broadcastsIndex + 1]) {
      const id = pathParts[broadcastsIndex + 1]
      // Skip if it's "create" or other non-ID paths
      if (id !== 'create' && id.length > 10) {
        setDocumentId(id)
      }
    }
  }, [])

  const generatePreview = useCallback(async () => {
    if (!documentId) {
      setError('Cannot generate preview: Document must be saved first. Save the document and try again.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch the saved document data via API
      const docResponse = await fetch(`/api/broadcasts/${documentId}`)
      if (!docResponse.ok) {
        throw new Error(`Failed to fetch document: ${docResponse.statusText}`)
      }
      const docData = await docResponse.json()

      console.log('[BroadcastPreview] Document data:', {
        id: docData.id,
        subject: docData.subject,
        hasContent: !!docData.contentSection?.content,
      })

      const content = docData.contentSection?.content || docData.content
      if (!content) {
        setError('No content available to preview. Add some content and save the document first.')
        setLoading(false)
        return
      }

      // Generate preview using the preview endpoint
      const response = await fetch('/api/broadcasts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          documentData: docData,
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
  }, [documentId])

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

          {!documentId && (
            <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Save the document first to enable preview.
            </div>
          )}

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

export interface BroadcastInlinePreviewProps {
  data?: any
  field?: any
  path?: string
  schemaPath?: string
}
