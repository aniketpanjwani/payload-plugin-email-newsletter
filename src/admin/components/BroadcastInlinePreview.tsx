'use client'

import React, { useState, useEffect, useRef } from 'react'

export interface BroadcastInlinePreviewProps {
  data?: any
  field?: any
  path?: string
  schemaPath?: string
}

export const BroadcastInlinePreview: React.FC<BroadcastInlinePreviewProps> = ({ 
  data,
  field: _field,
  path: _path,
  schemaPath: _schemaPath,
  ..._props 
}) => {
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const fetchPreview = async () => {
      // Don't fetch if no content
      if (!data?.content || !data.content.root?.children?.length) {
        setPreviewHtml('')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/broadcasts/preview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin', // Include cookies for auth
          body: JSON.stringify({
            content: data.content,
            subject: data.subject || '',
            preheader: data.preheader || '',
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to fetch preview: ${response.status}`)
        }

        const result = await response.json()
        
        if (result.success && result.html) {
          setPreviewHtml(result.html)
        } else {
          throw new Error(result.error || 'No preview HTML returned')
        }
      } catch (err) {
        console.error('Preview fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load preview')
      } finally {
        setLoading(false)
      }
    }

    // Debounce the preview fetch to avoid too many requests
    const timeoutId = setTimeout(fetchPreview, 500)
    return () => clearTimeout(timeoutId)
  }, [data?.content, data?.subject, data?.preheader])

  // Auto-resize iframe based on content
  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const iframe = iframeRef.current
      const resizeIframe = () => {
        try {
          const body = iframe.contentDocument?.body
          if (body) {
            iframe.style.height = `${body.scrollHeight + 40}px`
          }
        } catch {
          // Cross-origin error, set default height
          iframe.style.height = '600px'
        }
      }
      
      iframe.onload = resizeIframe
      // Also resize on window resize
      const contentWindow = iframe.contentWindow
      if (contentWindow) {
        contentWindow.addEventListener('resize', resizeIframe)
        return () => contentWindow.removeEventListener('resize', resizeIframe)
      }
    }
  }, [previewHtml])

  if (!data?.content) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#666',
        border: '1px dashed #ddd',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9'
      }}>
        <p>Start adding content to see the email preview</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ display: 'inline-block' }}>
          Loading preview...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        padding: '1rem',
        border: '1px solid #fee',
        borderRadius: '4px',
        backgroundColor: '#fef2f2',
        color: '#dc2626'
      }}>
        <strong>Preview Error:</strong> {error}
      </div>
    )
  }

  return (
    <div className="broadcast-preview" style={{ marginTop: '1rem' }}>
      <div style={{ 
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>
          Email Preview
        </h3>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          {data.subject && <span>Subject: {data.subject}</span>}
        </div>
      </div>
      
      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#fff'
      }}>
        <iframe
          ref={iframeRef}
          srcDoc={previewHtml}
          style={{
            width: '100%',
            minHeight: '400px',
            border: 'none',
            display: 'block'
          }}
          title="Email Preview"
          sandbox="allow-same-origin"
        />
      </div>
      
      <div style={{ 
        marginTop: '0.5rem',
        fontSize: '0.75rem',
        color: '#666',
        textAlign: 'center'
      }}>
        This preview shows how your email will appear when sent
      </div>
    </div>
  )
}