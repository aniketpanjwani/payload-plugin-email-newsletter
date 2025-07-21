'use client'
import React from 'react'

interface PreviewControlsProps {
  onUpdate: () => void
  device: 'desktop' | 'mobile'
  onDeviceChange: (device: 'desktop' | 'mobile') => void
  isLoading?: boolean
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({
  onUpdate,
  device,
  onDeviceChange,
  isLoading = false,
}) => {
  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
  }
  
  const updateButtonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    opacity: isLoading ? 0.6 : 1,
  }
  
  const deviceSelectorStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
  }
  
  const deviceButtonStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: isActive ? '#1f2937' : 'white',
    color: isActive ? 'white' : '#374151',
    border: `1px solid ${isActive ? '#1f2937' : '#e5e7eb'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  })
  
  return (
    <div style={controlsStyle}>
      <button 
        style={updateButtonStyle}
        onClick={onUpdate}
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Update Preview'}
      </button>
      
      <div style={deviceSelectorStyle}>
        <button
          style={deviceButtonStyle(device === 'desktop')}
          onClick={() => onDeviceChange('desktop')}
          aria-label="Desktop view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Desktop
        </button>
        
        <button
          style={deviceButtonStyle(device === 'mobile')}
          onClick={() => onDeviceChange('mobile')}
          aria-label="Mobile view"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18" />
          </svg>
          Mobile
        </button>
      </div>
    </div>
  )
}