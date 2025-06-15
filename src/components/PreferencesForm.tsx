'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import type { PreferencesFormProps, Subscriber } from '../types'

const defaultStyles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#111827',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  section: {
    padding: '1.5rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '500',
    marginBottom: '1rem',
    color: '#111827',
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
  select: {
    padding: '0.5rem 0.75rem',
    fontSize: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  checkboxInput: {
    width: '1rem',
    height: '1rem',
  },
  checkboxLabel: {
    fontSize: '0.875rem',
    color: '#374151',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
  },
  primaryButton: {
    color: '#ffffff',
    backgroundColor: '#3b82f6',
  },
  secondaryButton: {
    color: '#374151',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
  },
  dangerButton: {
    color: '#ffffff',
    backgroundColor: '#ef4444',
  },
  error: {
    fontSize: '0.875rem',
    color: '#ef4444',
    marginTop: '0.5rem',
  },
  success: {
    fontSize: '0.875rem',
    color: '#10b981',
    marginTop: '0.5rem',
  },
  info: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.5rem',
  },
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  subscriber: initialSubscriber,
  onSuccess,
  onError,
  className,
  styles: customStyles = {},
  sessionToken,
  apiEndpoint = '/api/newsletter/preferences',
  showUnsubscribe = true,
  locales = ['en'],
  labels = {
    title: 'Newsletter Preferences',
    personalInfo: 'Personal Information',
    emailPreferences: 'Email Preferences',
    name: 'Name',
    language: 'Preferred Language',
    newsletter: 'Newsletter updates',
    announcements: 'Product announcements',
    saveButton: 'Save Preferences',
    unsubscribeButton: 'Unsubscribe',
    saving: 'Saving...',
    saved: 'Preferences saved successfully!',
    unsubscribeConfirm: 'Are you sure you want to unsubscribe? This cannot be undone.',
  },
}) => {
  const [subscriber, setSubscriber] = useState<Partial<Subscriber>>(initialSubscriber || {})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!initialSubscriber)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const styles = {
    container: { ...defaultStyles.container, ...customStyles.container },
    heading: { ...defaultStyles.heading, ...customStyles.heading },
    form: { ...defaultStyles.form, ...customStyles.form },
    section: { ...defaultStyles.section, ...customStyles.section },
    sectionTitle: { ...defaultStyles.sectionTitle, ...customStyles.sectionTitle },
    inputGroup: { ...defaultStyles.inputGroup, ...customStyles.inputGroup },
    label: { ...defaultStyles.label, ...customStyles.label },
    input: { ...defaultStyles.input, ...customStyles.input },
    select: { ...defaultStyles.select, ...customStyles.select },
    checkbox: { ...defaultStyles.checkbox, ...customStyles.checkbox },
    checkboxInput: { ...defaultStyles.checkboxInput, ...customStyles.checkboxInput },
    checkboxLabel: { ...defaultStyles.checkboxLabel, ...customStyles.checkboxLabel },
    buttonGroup: { ...defaultStyles.buttonGroup, ...customStyles.buttonGroup },
    button: { ...defaultStyles.button, ...customStyles.button },
    primaryButton: { ...defaultStyles.primaryButton, ...customStyles.primaryButton },
    secondaryButton: { ...defaultStyles.secondaryButton, ...customStyles.secondaryButton },
    dangerButton: { ...defaultStyles.dangerButton, ...customStyles.dangerButton },
    error: { ...defaultStyles.error, ...customStyles.error },
    success: { ...defaultStyles.success, ...customStyles.success },
    info: { ...defaultStyles.info, ...customStyles.info },
  }

  // Fetch current preferences if not provided
  useEffect(() => {
    if (!initialSubscriber && sessionToken) {
      fetchPreferences()
    }
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load preferences')
      }

      const data = await response.json()
      setSubscriber(data.subscriber)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preferences')
      if (onError) {
        onError(err instanceof Error ? err : new Error('Failed to load preferences'))
      }
    } finally {
      setLoadingData(false)
    }
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          name: subscriber.name,
          locale: subscriber.locale,
          emailPreferences: subscriber.emailPreferences,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences')
      }

      setSubscriber(data.subscriber)
      setSuccess(true)
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

  const handleUnsubscribe = async () => {
    if (!window.confirm(labels.unsubscribeConfirm)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          email: subscriber.email,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to unsubscribe')
      }

      setSubscriber({ ...subscriber, subscriptionStatus: 'unsubscribed' })
      if (onSuccess) {
        onSuccess({ ...subscriber, subscriptionStatus: 'unsubscribed' } as Subscriber)
      }
    } catch (err) {
      setError('Failed to unsubscribe. Please try again.')
      if (onError) {
        onError(err instanceof Error ? err : new Error('Failed to unsubscribe'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className={className} style={styles.container}>
        <p style={styles.info}>Loading preferences...</p>
      </div>
    )
  }

  if (subscriber.subscriptionStatus === 'unsubscribed') {
    return (
      <div className={className} style={styles.container}>
        <h2 style={styles.heading}>Unsubscribed</h2>
        <p style={styles.info}>
          You have been unsubscribed from all emails. 
          To resubscribe, please sign up again.
        </p>
      </div>
    )
  }

  return (
    <div className={className} style={styles.container}>
      <h2 style={styles.heading}>{labels.title}</h2>
      
      <form onSubmit={handleSave} style={styles.form}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>{labels.personalInfo}</h3>
          
          <div style={styles.inputGroup}>
            <label htmlFor="name" style={styles.label}>
              {labels.name}
            </label>
            <input
              id="name"
              type="text"
              value={subscriber.name || ''}
              onChange={(e) => setSubscriber({ ...subscriber, name: e.target.value })}
              disabled={loading}
              style={styles.input}
            />
          </div>

          {locales.length > 1 && (
            <div style={styles.inputGroup}>
              <label htmlFor="locale" style={styles.label}>
                {labels.language}
              </label>
              <select
                id="locale"
                value={subscriber.locale || locales[0]}
                onChange={(e) => setSubscriber({ ...subscriber, locale: e.target.value })}
                disabled={loading}
                style={styles.select}
              >
                {locales.map(locale => (
                  <option key={locale} value={locale}>
                    {locale.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>{labels.emailPreferences}</h3>
          
          <div style={styles.checkbox}>
            <input
              id="pref-newsletter"
              type="checkbox"
              checked={subscriber.emailPreferences?.newsletter ?? true}
              onChange={(e) =>
                setSubscriber({
                  ...subscriber,
                  emailPreferences: {
                    ...subscriber.emailPreferences,
                    newsletter: e.target.checked,
                  },
                })
              }
              disabled={loading}
              style={styles.checkboxInput}
            />
            <label htmlFor="pref-newsletter" style={styles.checkboxLabel}>
              {labels.newsletter}
            </label>
          </div>

          <div style={styles.checkbox}>
            <input
              id="pref-announcements"
              type="checkbox"
              checked={subscriber.emailPreferences?.announcements ?? true}
              onChange={(e) =>
                setSubscriber({
                  ...subscriber,
                  emailPreferences: {
                    ...subscriber.emailPreferences,
                    announcements: e.target.checked,
                  },
                })
              }
              disabled={loading}
              style={styles.checkboxInput}
            />
            <label htmlFor="pref-announcements" style={styles.checkboxLabel}>
              {labels.announcements}
            </label>
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.primaryButton,
              ...(loading && { opacity: 0.5, cursor: 'not-allowed' }),
            }}
          >
            {loading ? labels.saving : labels.saveButton}
          </button>

          {showUnsubscribe && (
            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={loading}
              style={{
                ...styles.button,
                ...styles.dangerButton,
                ...(loading && { opacity: 0.5, cursor: 'not-allowed' }),
              }}
            >
              {labels.unsubscribeButton}
            </button>
          )}
        </div>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{labels.saved}</p>}
      </form>
    </div>
  )
}

// Factory function for creating custom preferences forms
export function createPreferencesForm(
  defaultProps: Partial<PreferencesFormProps>
): React.FC<PreferencesFormProps> {
  return (props: PreferencesFormProps) => (
    <PreferencesForm {...defaultProps} {...props} />
  )
}