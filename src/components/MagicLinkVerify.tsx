'use client'

import React, { useState, useEffect } from 'react'

export interface MagicLinkVerifyProps {
  token?: string
  onSuccess?: (sessionToken: string, subscriber: any) => void
  onError?: (error: Error) => void
  apiEndpoint?: string
  className?: string
  styles?: {
    container?: React.CSSProperties
    heading?: React.CSSProperties
    message?: React.CSSProperties
    error?: React.CSSProperties
    button?: React.CSSProperties
  }
  labels?: {
    verifying?: string
    success?: string
    error?: string
    expired?: string
    invalid?: string
    redirecting?: string
    tryAgain?: string
  }
}

const defaultStyles = {
  container: {
    maxWidth: '400px',
    margin: '4rem auto',
    padding: '2rem',
    textAlign: 'center' as const,
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#111827',
  },
  message: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  error: {
    fontSize: '1rem',
    color: '#ef4444',
    marginBottom: '1.5rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
}

export const MagicLinkVerify: React.FC<MagicLinkVerifyProps> = ({
  token: propToken,
  onSuccess,
  onError,
  apiEndpoint = '/api/newsletter/verify-magic-link',
  className,
  styles: customStyles = {},
  labels = {
    verifying: 'Verifying your magic link...',
    success: 'Successfully verified! Redirecting...',
    error: 'Failed to verify magic link',
    expired: 'This magic link has expired. Please request a new one.',
    invalid: 'This magic link is invalid. Please request a new one.',
    redirecting: 'Redirecting to your preferences...',
    tryAgain: 'Try Again',
  },
}) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [error, setError] = useState<string | null>(null)
  const [_sessionToken, setSessionToken] = useState<string | null>(null)

  const styles = {
    container: { ...defaultStyles.container, ...customStyles.container },
    heading: { ...defaultStyles.heading, ...customStyles.heading },
    message: { ...defaultStyles.message, ...customStyles.message },
    error: { ...defaultStyles.error, ...customStyles.error },
    button: { ...defaultStyles.button, ...customStyles.button },
  }

  useEffect(() => {
    // Get token from props or URL
    const token = propToken || new URLSearchParams(window.location.search).get('token')
    
    if (token) {
      verifyToken(token)
    } else {
      setStatus('error')
      setError(labels.invalid || 'Invalid magic link')
    }
  }, [propToken])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.includes('expired')) {
          throw new Error(labels.expired)
        }
        throw new Error(data.error || labels.error)
      }

      setStatus('success')
      setSessionToken(data.sessionToken)

      // Store session token
      if (typeof window !== 'undefined' && data.sessionToken) {
        localStorage.setItem('newsletter_session', data.sessionToken)
      }

      if (onSuccess) {
        onSuccess(data.sessionToken, data.subscriber)
      }
    } catch (err) {
      setStatus('error')
      const errorMessage = err instanceof Error ? err.message : (labels.error || 'Verification failed')
      setError(errorMessage)
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage))
      }
    }
  }

  const handleTryAgain = () => {
    window.location.href = '/'
  }

  return (
    <div className={className} style={styles.container}>
      {status === 'verifying' && (
        <>
          <h2 style={styles.heading}>Verifying</h2>
          <p style={styles.message}>{labels.verifying}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <h2 style={styles.heading}>Success!</h2>
          <p style={styles.message}>{labels.success}</p>
        </>
      )}

      {status === 'error' && (
        <>
          <h2 style={styles.heading}>Verification Failed</h2>
          <p style={styles.error}>{error}</p>
          <button onClick={handleTryAgain} style={styles.button}>
            {labels.tryAgain}
          </button>
        </>
      )}
    </div>
  )
}

// Factory function for creating custom magic link verify components
export function createMagicLinkVerify(
  defaultProps: Partial<MagicLinkVerifyProps>
): React.FC<MagicLinkVerifyProps> {
  return (props: MagicLinkVerifyProps) => (
    <MagicLinkVerify {...defaultProps} {...props} />
  )
}