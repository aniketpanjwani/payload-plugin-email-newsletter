'use client'
import React, { useState, useCallback } from 'react'
import { useFormFields } from '@payloadcms/ui'
import { transformContentForPreview } from '../../utils/contentTransformer'
import { loadTemplate } from '../../utils/templateLoader'
import { EmailRenderer } from './EmailRenderer'
import { PreviewControls } from './PreviewControls'

export const BroadcastInlinePreview: React.FC = () => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<{
    template: React.ComponentType<any>
    data: any
  } | null>(null)
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
      const htmlContent = await transformContentForPreview(fields.content as any, {
        mediaUrl: '/api/media',
      })
      
      const template = await loadTemplate()
      
      setPreviewData({
        template,
        data: {
          subject: fields.subject || '',
          preheader: fields.preheader || '',
          content: htmlContent,
        }
      })
      
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
    minHeight: '600px',
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
          ) : previewData ? (
            <>
              <PreviewControls 
                onUpdate={updatePreview}
                device={device}
                onDeviceChange={setDevice}
                isLoading={isLoading}
              />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <EmailRenderer 
                  template={previewData.template}
                  data={previewData.data}
                  device={device}
                />
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default BroadcastInlinePreview