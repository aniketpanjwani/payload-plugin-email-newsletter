'use client'

import React from 'react'

export interface EmailPreviewProps {
  content?: any
  subject?: string
  preheader?: string
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  content,
  subject,
  preheader
}) => {
  return (
    <div className="email-preview" style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Subject:</strong> {subject || 'No subject'}
      </div>
      {preheader && (
        <div style={{ marginBottom: '1rem', color: '#666' }}>
          <strong>Preheader:</strong> {preheader}
        </div>
      )}
      <div style={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: '4px', 
        padding: '1rem',
        backgroundColor: '#f9f9f9'
      }}>
        <div>Email content will be rendered here</div>
        {content && (
          <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
            Content type: {typeof content}
          </div>
        )}
      </div>
    </div>
  )
}