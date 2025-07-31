'use client'

import React from 'react'

export interface BroadcastInlinePreviewProps {
  field?: any
  data?: any
}

export const BroadcastInlinePreview: React.FC<BroadcastInlinePreviewProps> = ({
  field,
  data,
  ...props
}) => {
  // Pure React component
  // NO server-side imports
  // NO Payload utilities that touch Node.js APIs
  // NO telemetry or logging
  
  return (
    <div className="broadcast-preview">
      <div style={{ padding: '1rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
        <h3>Email Preview</h3>
        <p>This is a simplified preview component for the admin bundle.</p>
        <p>Full preview functionality will be available in the complete admin interface.</p>
      </div>
    </div>
  )
}