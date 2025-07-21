'use client'
import React from 'react'

// Simple placeholder for now - users should use BroadcastInlinePreview instead
export const BroadcastPreviewField: React.FC = () => {
  return (
    <div style={{ 
      padding: '1rem', 
      background: '#f9fafb', 
      borderRadius: '4px',
      fontSize: '14px',
      color: '#6b7280',
    }}>
      Email preview is available inline below the content editor.
    </div>
  )
}

export default BroadcastPreviewField