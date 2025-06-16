import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MagicLinkVerify } from '../../../components/MagicLinkVerify'

// Mock fetch
global.fetch = vi.fn()

// Mock window.location
const mockLocation = {
  search: '?token=valid-token-123',
  href: 'http://localhost:3000/verify?token=valid-token-123',
  replace: vi.fn()
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('MagicLinkVerify Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.search = '?token=valid-token-123'
    mockLocation.replace.mockClear()
  })

  describe('Token Extraction', () => {
    it('should extract token from URL parameters', () => {
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
        />
      )
      
      expect(screen.getByRole('heading', { name: /verifying/i })).toBeInTheDocument()
    })

    it('should show error if no token provided', async () => {
      mockLocation.search = ''
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/This magic link is invalid/i)).toBeInTheDocument()
      })
    })

    it('should handle multiple URL parameters', async () => {
      mockLocation.search = '?ref=email&token=valid-token-123&utm_source=newsletter'
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          sessionToken: 'session-token-123',
          subscriber: { email: 'user@example.com' }
        })
      } as Response)
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
        />
      )
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/newsletter/verify-magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: 'valid-token-123' })
        })
      })
    })
  })

  describe('Verification Process', () => {
    it('should show loading state during verification', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {})) // Never resolves
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
        />
      )
      
      expect(screen.getByText(/verifying your magic link/i)).toBeInTheDocument()
    })

    it('should handle successful verification', async () => {
      const onSuccess = vi.fn()
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          sessionToken: 'session-token-123',
          subscriber: {
            id: 'sub-123',
            email: 'user@example.com',
            name: 'John Doe'
          }
        })
      } as Response)
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
          onSuccess={onSuccess}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Success!/i)).toBeInTheDocument()
        expect(screen.getByText(/Successfully verified/i)).toBeInTheDocument()
        expect(onSuccess).toHaveBeenCalledWith(
          'session-token-123',
          {
            id: 'sub-123',
            email: 'user@example.com',
            name: 'John Doe'
          }
        )
      })
    })

    it('should store session token', async () => {
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      }
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      })
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          sessionToken: 'session-token-123',
          subscriber: { email: 'user@example.com' }
        })
      } as Response)
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
        />
      )
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'newsletter_session',
          'session-token-123'
        )
      })
    })

    it('should handle invalid token', async () => {
      const onError = vi.fn()
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ 
          success: false, 
          error: 'Invalid or expired token'
        })
      } as Response)
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
          onError={onError}
        />
      )
      
      await waitFor(() => {
        // Component shows the actual error message from API
        expect(screen.getByText('Invalid or expired token')).toBeInTheDocument()
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should handle already used token', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ 
          success: false, 
          error: 'Token already used'
        })
      } as Response)
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Token already used/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('UI States', () => {
    it('should render with custom labels', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          sessionToken: 'session-token-123',
          subscriber: { email: 'user@example.com' }
        })
      } as Response)
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
          labels={{
            success: 'Email confirmed!',
            verifying: 'Checking your link...'
          }}
        />
      )
      
      expect(screen.getByText(/Checking your link/i)).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByText(/Email confirmed!/i)).toBeInTheDocument()
      })
    })

    it('should render with custom styles', () => {
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
          styles={{
            container: { backgroundColor: '#f0f0f0' },
            heading: { color: '#333' }
          }}
        />
      )
      
      const container = screen.getByText(/Verifying/i).parentElement
      expect(container).toHaveStyle({ backgroundColor: '#f0f0f0' })
    })
  })

  describe('Error Handling', () => {
    it('should handle expired tokens', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ 
          success: false, 
          error: 'Token expired'
        })
      } as Response)
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
          labels={{
            expired: 'Your link has expired. Please request a new one.'
          }}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Your link has expired/i)).toBeInTheDocument()
      })
    })

    it('should use prop token if provided', async () => {
      mockLocation.search = '' // No token in URL
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          sessionToken: 'session-token-123',
          subscriber: { email: 'user@example.com' }
        })
      } as Response)
      
      render(
        <MagicLinkVerify 
          token="prop-token-123"
          apiEndpoint="/api/newsletter/verify-magic-link"
        />
      )
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/newsletter/verify-magic-link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token: 'prop-token-123' })
        })
      })
    })
  })

  describe('Try Again Button', () => {
    it('should show try again button on error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ 
          success: false, 
          error: 'Invalid token'
        })
      } as Response)
      
      render(
        <MagicLinkVerify 
          apiEndpoint="/api/newsletter/verify-magic-link"
        />
      )
      
      await waitFor(() => {
        const tryAgainButton = screen.getByText(/Try Again/i)
        expect(tryAgainButton).toBeInTheDocument()
      })
    })
  })
})