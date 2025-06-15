'use client'

import React, { useState, FormEvent } from 'react'
import type { SignupFormProps } from '../types'

const defaultStyles = {
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    maxWidth: '400px',
    margin: '0 auto',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    outline: 'none',
    transition: 'border-color 0.2s',
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
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    fontSize: '0.875rem',
    color: '#ef4444',
    marginTop: '0.25rem',
  },
  success: {
    fontSize: '0.875rem',
    color: '#10b981',
    marginTop: '0.25rem',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkboxInput: {
    width: '1rem',
    height: '1rem',
  },
  checkboxLabel: {
    fontSize: '0.875rem',
    color: '#374151',
  },
}

export const NewsletterForm: React.FC<SignupFormProps> = ({
  onSuccess,
  onError,
  showName = false,
  showPreferences = false,
  leadMagnet,
  className,
  styles: customStyles = {},
  apiEndpoint = '/api/newsletter/subscribe',
  buttonText = 'Subscribe',
  loadingText = 'Subscribing...',
  successMessage = 'Successfully subscribed!',
  placeholders = {
    email: 'Enter your email',
    name: 'Enter your name',
  },
  labels = {
    email: 'Email',
    name: 'Name',
    newsletter: 'Newsletter updates',
    announcements: 'Product announcements',
  },
}) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [preferences, setPreferences] = useState({
    newsletter: true,
    announcements: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const styles = {
    form: { ...defaultStyles.form, ...customStyles.form },
    inputGroup: { ...defaultStyles.inputGroup, ...customStyles.inputGroup },
    label: { ...defaultStyles.label, ...customStyles.label },
    input: { ...defaultStyles.input, ...customStyles.input },
    button: { ...defaultStyles.button, ...customStyles.button },
    buttonDisabled: { ...defaultStyles.buttonDisabled, ...customStyles.buttonDisabled },
    error: { ...defaultStyles.error, ...customStyles.error },
    success: { ...defaultStyles.success, ...customStyles.success },
    checkbox: { ...defaultStyles.checkbox, ...customStyles.checkbox },
    checkboxInput: { ...defaultStyles.checkboxInput, ...customStyles.checkboxInput },
    checkboxLabel: { ...defaultStyles.checkboxLabel, ...customStyles.checkboxLabel },
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const payload: any = {
        email,
        ...(showName && name && { name }),
        ...(showPreferences && { preferences }),
        ...(leadMagnet && { leadMagnet: leadMagnet.id }),
        metadata: {
          signupPage: window.location.href,
          ...(typeof window !== 'undefined' && window.location.search && {
            utmParams: Object.fromEntries(new URLSearchParams(window.location.search)),
          }),
        },
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.errors?.join(', ') || 'Subscription failed')
      }

      setSuccess(true)
      setEmail('')
      setName('')
      if (onSuccess) {
        onSuccess(data.subscriber)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      if (onError) {
        onError(new Error(errorMessage))
      }
    } finally {
      setLoading(false)
    }
  }

  if (success && !showPreferences) {
    return (
      <div className={className} style={styles.form}>
        <p style={styles.success}>{successMessage}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={className} style={styles.form}>
      <div style={styles.inputGroup}>
        <label htmlFor="email" style={styles.label}>
          {labels.email}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholders.email}
          required
          disabled={loading}
          style={{
            ...styles.input,
            ...(loading && { opacity: 0.5 }),
          }}
        />
      </div>

      {showName && (
        <div style={styles.inputGroup}>
          <label htmlFor="name" style={styles.label}>
            {labels.name}
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={placeholders.name}
            disabled={loading}
            style={{
              ...styles.input,
              ...(loading && { opacity: 0.5 }),
            }}
          />
        </div>
      )}

      {showPreferences && (
        <div style={styles.inputGroup}>
          <label style={styles.label}>Email Preferences</label>
          <div style={styles.checkbox}>
            <input
              id="newsletter"
              type="checkbox"
              checked={preferences.newsletter}
              onChange={(e) =>
                setPreferences({ ...preferences, newsletter: e.target.checked })
              }
              disabled={loading}
              style={styles.checkboxInput}
            />
            <label htmlFor="newsletter" style={styles.checkboxLabel}>
              {labels.newsletter}
            </label>
          </div>
          <div style={styles.checkbox}>
            <input
              id="announcements"
              type="checkbox"
              checked={preferences.announcements}
              onChange={(e) =>
                setPreferences({ ...preferences, announcements: e.target.checked })
              }
              disabled={loading}
              style={styles.checkboxInput}
            />
            <label htmlFor="announcements" style={styles.checkboxLabel}>
              {labels.announcements}
            </label>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          ...styles.button,
          ...(loading && styles.buttonDisabled),
        }}
      >
        {loading ? loadingText : buttonText}
      </button>

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{successMessage}</p>}
    </form>
  )
}

// Factory function for creating custom newsletter forms
export function createNewsletterForm(
  defaultProps: Partial<SignupFormProps>
): React.FC<SignupFormProps> {
  return (props: SignupFormProps) => (
    <NewsletterForm {...defaultProps} {...props} />
  )
}