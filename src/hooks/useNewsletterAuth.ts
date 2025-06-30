'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Subscriber } from '../types'

export interface UseNewsletterAuthOptions {
  // Reserved for future use
}

export interface UseNewsletterAuthReturn {
  subscriber: Subscriber | null
  isAuthenticated: boolean
  isLoading: boolean
  loading: boolean // Alias for backward compatibility
  error: Error | null
  signOut: () => Promise<void>
  logout: () => Promise<void> // Alias for backward compatibility
  refreshAuth: () => Promise<void>
  refreshSubscriber: () => Promise<void> // Alias for backward compatibility
  login: (token: string) => Promise<void> // For backward compatibility
}

export function useNewsletterAuth(
  _options: UseNewsletterAuthOptions = {}
): UseNewsletterAuthReturn {
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/newsletter/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSubscriber(data.subscriber)
        setError(null)
      } else {
        setSubscriber(null)
        if (response.status !== 401) {
          setError(new Error('Failed to check authentication'))
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err)
      setError(err instanceof Error ? err : new Error('An error occurred'))
      setSubscriber(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const signOut = useCallback(async () => {
    try {
      const response = await fetch('/api/newsletter/signout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setSubscriber(null)
        setError(null)
      } else {
        throw new Error('Failed to sign out')
      }
    } catch (err) {
      console.error('Sign out error:', err)
      setError(err instanceof Error ? err : new Error('Sign out failed'))
      throw err
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    setIsLoading(true)
    await checkAuth()
  }, [checkAuth])

  // Backward compatibility: login function that accepts a token
  // In the new implementation, authentication is handled via cookies
  const login = useCallback(async (_token: string) => {
    // Token is now handled server-side via cookies
    // Just refresh the auth state
    await refreshAuth()
  }, [refreshAuth])

  return {
    subscriber,
    isAuthenticated: !!subscriber,
    isLoading,
    loading: isLoading, // Alias for backward compatibility
    error,
    signOut,
    logout: signOut, // Alias for backward compatibility
    refreshAuth,
    refreshSubscriber: refreshAuth, // Alias for backward compatibility
    login, // For backward compatibility
  }
}