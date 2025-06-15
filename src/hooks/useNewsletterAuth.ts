'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Subscriber } from '../types'

export interface UseNewsletterAuthOptions {
  sessionTokenKey?: string
  apiEndpoint?: string
}

export interface UseNewsletterAuthReturn {
  subscriber: Subscriber | null
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  login: (token: string) => Promise<void>
  logout: () => void
  refreshSubscriber: () => Promise<void>
}

export function useNewsletterAuth(
  options: UseNewsletterAuthOptions = {}
): UseNewsletterAuthReturn {
  const {
    sessionTokenKey = 'newsletter_session',
    apiEndpoint = '/api/newsletter/preferences',
  } = options

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Get session token from localStorage
  const getSessionToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(sessionTokenKey)
  }, [sessionTokenKey])

  // Set session token in localStorage
  const setSessionToken = useCallback((token: string | null) => {
    if (typeof window === 'undefined') return
    if (token) {
      localStorage.setItem(sessionTokenKey, token)
    } else {
      localStorage.removeItem(sessionTokenKey)
    }
  }, [sessionTokenKey])

  // Fetch subscriber data
  const fetchSubscriber = useCallback(async (token: string) => {
    try {
      const response = await fetch(apiEndpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, clear it
          setSessionToken(null)
          throw new Error('Session expired')
        }
        throw new Error('Failed to fetch subscriber')
      }

      const data = await response.json()
      setSubscriber(data.subscriber)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'))
      setSubscriber(null)
      throw err
    }
  }, [apiEndpoint, setSessionToken])

  // Initial load
  useEffect(() => {
    const token = getSessionToken()
    if (token) {
      fetchSubscriber(token)
        .catch(() => {
          // Error is already handled in fetchSubscriber
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Login with session token
  const login = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      setSessionToken(token)
      await fetchSubscriber(token)
    } catch (err) {
      setSessionToken(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchSubscriber, setSessionToken])

  // Logout
  const logout = useCallback(() => {
    setSessionToken(null)
    setSubscriber(null)
    setError(null)
  }, [setSessionToken])

  // Refresh subscriber data
  const refreshSubscriber = useCallback(async () => {
    const token = getSessionToken()
    if (!token) {
      throw new Error('Not authenticated')
    }
    await fetchSubscriber(token)
  }, [fetchSubscriber, getSessionToken])

  return {
    subscriber,
    loading,
    error,
    isAuthenticated: !!subscriber,
    login,
    logout,
    refreshSubscriber,
  }
}