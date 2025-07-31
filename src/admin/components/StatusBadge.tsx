'use client'

import React from 'react'

export interface StatusBadgeProps {
  cellData?: string
  rowData?: any
}

export const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
  // Get config from Payload's built-in mechanisms instead of React context
  const status = props.cellData || 'draft'
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return '#22c55e'
      case 'scheduled': return '#3b82f6'
      case 'draft': return '#6b7280'
      case 'failed': return '#ef4444'
      default: return '#6b7280'
    }
  }
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Sent'
      case 'scheduled': return 'Scheduled'
      case 'draft': return 'Draft'
      case 'failed': return 'Failed'
      default: return status
    }
  }
  
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        color: '#fff',
        backgroundColor: getStatusColor(status),
        textTransform: 'capitalize',
      }}
    >
      {getStatusLabel(status)}
    </span>
  )
}