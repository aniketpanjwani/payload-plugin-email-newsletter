'use client'
import React, { useState, useCallback } from 'react'
import { useFormFields } from '@payloadcms/ui'
import { PreviewControls } from './PreviewControls'

export const BroadcastInlinePreview: React.FC = () => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  const fields = useFormFields(([fields]) => ({
    subject: fields['subject']?.value as string,
    preheader: fields['contentSection.preheader']?.value as string,
    content: fields['contentSection.content']?.value,
  }))
  
  const updatePreview = useCallback(async () => {
    if (!fields.content) {
      setError(new Error('Please add some content before previewing'))
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Call the server-side preview endpoint
      const response = await fetch('/api/broadcasts/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fields.content,
          preheader: fields.preheader,
          subject: fields.subject,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate preview')
      }
      
      setPreviewHtml(data.preview.html)
      setShowPreview(true)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to update preview:', err)
    } finally {
      setIsLoading(false)
    }
  }, [fields])
  
  const containerStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }
  
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  }
  
  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
    margin: 0,
  }
  
  const previewContainerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#f3f4f6',
    overflow: 'hidden',
  }
  
  const errorStyle: React.CSSProperties = {
    padding: '2rem',
    textAlign: 'center',
  }
  
  const toggleButtonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    background: showPreview ? '#ef4444' : '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  }
  
  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Email Preview</h3>
        <button
          onClick={() => showPreview ? setShowPreview(false) : updatePreview()}
          style={toggleButtonStyle}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>
      
      {showPreview && (
        <div style={previewContainerStyle}>
          {error ? (
            <div style={errorStyle}>
              <p style={{ color: '#ef4444', margin: '0 0 1rem' }}>{error.message}</p>
              <button 
                onClick={updatePreview}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : previewHtml ? (
            <>
              <PreviewControls 
                onUpdate={updatePreview}
                device={device}
                onDeviceChange={setDevice}
                isLoading={isLoading}
              />
              <div
                style={{
                  flex: 1,
                  padding: device === 'mobile' ? '1rem' : '2rem',
                  display: 'flex',
                  justifyContent: 'center',
                  overflow: 'auto',
                }}
              >
                <div
                  style={{
                    width: device === 'mobile' ? '375px' : '600px',
                    maxWidth: '100%',
                    background: 'white',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <iframe
                    srcDoc={previewHtml}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '600px',
                      border: 'none',
                    }}
                    title="Email Preview"
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default BroadcastInlinePreview