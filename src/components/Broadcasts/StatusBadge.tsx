'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'
import { BroadcastStatus } from '../../types'

const statusConfig = {
  [BroadcastStatus.DRAFT]: {
    label: 'Draft',
    color: '#6B7280', // gray
    backgroundColor: '#F3F4F6',
  },
  [BroadcastStatus.SCHEDULED]: {
    label: 'Scheduled',
    color: '#2563EB', // blue
    backgroundColor: '#DBEAFE',
  },
  [BroadcastStatus.SENDING]: {
    label: 'Sending',
    color: '#D97706', // yellow/orange
    backgroundColor: '#FEF3C7',
  },
  [BroadcastStatus.SENT]: {
    label: 'Sent',
    color: '#059669', // green
    backgroundColor: '#D1FAE5',
  },
  [BroadcastStatus.FAILED]: {
    label: 'Failed',
    color: '#DC2626', // red
    backgroundColor: '#FEE2E2',
  },
  [BroadcastStatus.PAUSED]: {
    label: 'Paused',
    color: '#9333EA', // purple
    backgroundColor: '#EDE9FE',
  },
  [BroadcastStatus.CANCELED]: {
    label: 'Canceled',
    color: '#6B7280', // gray
    backgroundColor: '#F3F4F6',
  },
}

export const StatusBadge: React.FC<DefaultCellComponentProps> = ({ cellData }) => {
  const status = cellData as BroadcastStatus
  const config = statusConfig[status] || statusConfig[BroadcastStatus.DRAFT]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        color: config.color,
        backgroundColor: config.backgroundColor,
      }}
    >
      {config.label}
    </span>
  )
}