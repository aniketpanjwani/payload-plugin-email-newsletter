'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { render } from '@react-email/render'

interface EmailRendererProps {
  template: React.ComponentType<any>
  data: {
    subject: string
    preheader?: string
    content: string
    [key: string]: any
  }
  device?: 'desktop' | 'mobile'
  onRender?: (html: string) => void
}

export const EmailRenderer: React.FC<EmailRendererProps> = ({ 
  template, 
  data, 
  device = 'desktop',
  onRender 
}) => {
  const [renderedHtml, setRenderedHtml] = useState<string>('')
  const [error, setError] = useState<Error | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  const renderEmail = useCallback(async () => {
    try {
      const TemplateComponent = template
      const element = <TemplateComponent {...data} />
      
      const html = await render(element, {
        pretty: true,
      })
      
      setRenderedHtml(html)
      onRender?.(html)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to render email template:', err)
    }
  }, [template, data, onRender])
  
  useEffect(() => {
    renderEmail()
  }, [renderEmail])
  
  useEffect(() => {
    if (iframeRef.current && renderedHtml) {
      const iframe = iframeRef.current
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      
      if (doc) {
        doc.open()
        doc.write(renderedHtml)
        doc.close()
      }
    }
  }, [renderedHtml])
  
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
  
  const iframeStyle: React.CSSProperties = {
    width: device === 'mobile' ? '375px' : '600px',
    maxWidth: '100%',
    height: '100%',
    background: 'white',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    borderRadius: device === 'mobile' ? '20px' : '8px',
    border: 'none',
    display: 'block',
  }
  
  const errorStyle: React.CSSProperties = {
    background: 'white',
    border: '1px solid #ef4444',
    borderRadius: '4px',
    padding: '2rem',
    maxWidth: '500px',
  }
  
  if (error) {
    return (
      <div style={errorStyle}>
        <h3 style={{ color: '#ef4444', margin: '0 0 1rem' }}>Template Render Error</h3>
        <pre style={{ 
          background: '#f9fafb', 
          padding: '1rem', 
          borderRadius: '4px',
          overflowX: 'auto',
          fontSize: '12px',
          color: '#374151',
          margin: 0,
        }}>{error.message}</pre>
      </div>
    )
  }
  
  return (
    <div style={containerStyle}>
      <iframe
        ref={iframeRef}
        style={iframeStyle}
        sandbox="allow-same-origin"
        title="Email Preview"
      />
    </div>
  )
}