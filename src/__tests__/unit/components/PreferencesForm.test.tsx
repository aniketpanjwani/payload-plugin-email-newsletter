import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { PreferencesForm } from '../../../components/PreferencesForm'

// Mock fetch
global.fetch = vi.fn()

describe('PreferencesForm Component', () => {
  const mockSubscriber = {
    id: 'sub-123',
    email: 'user@example.com',
    name: 'John Doe',
    emailPreferences: {
      newsletter: true,
      announcements: false
    },
    locale: 'en'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render loading state initially', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {})) // Never resolves
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      expect(screen.getByText(/loading preferences/i)).toBeInTheDocument()
    })

    it('should render form with fetched data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, subscriber: mockSubscriber })
      } as Response)
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe')
        expect(screen.getByLabelText(/newsletter/i)).toBeChecked()
        expect(screen.getByLabelText(/announcements/i)).not.toBeChecked()
      })
    })

    it('should include authorization header', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, subscriber: mockSubscriber })
      } as Response)
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/newsletter/preferences', {
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        })
      })
    })

    it('should handle fetch errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load preferences/i)).toBeInTheDocument()
      })
    })

    it('should handle unauthorized access', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' })
      } as Response)
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="invalid-token"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load preferences/i)).toBeInTheDocument()
      })
    })
  })

  describe('Preference Updates', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, subscriber: mockSubscriber })
      } as Response)
    })

    it('should update email preferences', async () => {
      const user = userEvent.setup()
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      // Wait for form to load
      await waitFor(() => {
        expect(screen.getByLabelText(/newsletter/i)).toBeChecked()
      })
      
      // Update preferences
      const newsletterCheckbox = screen.getByLabelText(/newsletter/i)
      const announcementsCheckbox = screen.getByLabelText(/announcements/i)
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)
      
      await user.click(newsletterCheckbox) // Uncheck
      await user.click(announcementsCheckbox) // Check
      await user.click(screen.getByRole('button', { name: /save preferences/i }))
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/newsletter/preferences', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'John Doe',
            emailPreferences: {
              newsletter: false,
              announcements: true
            },
            locale: 'en'
          })
        })
      })
    })

    it('should update name', async () => {
      const user = userEvent.setup()
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toHaveValue('John Doe')
      })
      
      const nameInput = screen.getByLabelText(/name/i)
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Jane Smith')
      await user.click(screen.getByRole('button', { name: /save preferences/i }))
      
      await waitFor(() => {
        const call = vi.mocked(fetch).mock.calls[1]
        const body = JSON.parse(call[1]?.body as string)
        expect(body.name).toBe('Jane Smith')
      })
    })

    it('should update locale if supported', async () => {
      const user = userEvent.setup()
      
      render(
        <PreferencesForm 
          endpoint="/api/newsletter/preferences"
          token="valid-token"
          supportedLocales={['en', 'es', 'fr']}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByLabelText(/language/i)).toBeInTheDocument()
      })
      
      const localeSelect = screen.getByLabelText(/language/i)
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)
      
      await user.selectOptions(localeSelect, 'es')
      await user.click(screen.getByRole('button', { name: /save preferences/i }))
      
      await waitFor(() => {
        const call = vi.mocked(fetch).mock.calls[1]
        const body = JSON.parse(call[1]?.body as string)
        expect(body.locale).toBe('es')
      })
    })

    it('should show success message on update', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      
      render(
        <PreferencesForm 
          endpoint="/api/newsletter/preferences"
          token="valid-token"
          onSuccess={onSuccess}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Preferences updated' })
      } as Response)
      
      await user.click(screen.getByRole('button', { name: /save preferences/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/preferences updated/i)).toBeInTheDocument()
        expect(onSuccess).toHaveBeenCalledWith({ 
          success: true, 
          message: 'Preferences updated' 
        })
      })
    })

    it('should handle update errors', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      
      render(
        <PreferencesForm 
          endpoint="/api/newsletter/preferences"
          token="valid-token"
          onError={onError}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'Invalid data' })
      } as Response)
      
      await user.click(screen.getByRole('button', { name: /save preferences/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/invalid data/i)).toBeInTheDocument()
        expect(onError).toHaveBeenCalledWith('Invalid data')
      })
    })
  })

  describe('Unsubscribe Feature', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, subscriber: mockSubscriber })
      } as Response)
    })

    it('should show unsubscribe button', async () => {
      render(
        <PreferencesForm 
          endpoint="/api/newsletter/preferences"
          token="valid-token"
          showUnsubscribe={true}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /unsubscribe/i })).toBeInTheDocument()
      })
    })

    it('should confirm before unsubscribing', async () => {
      const user = userEvent.setup()
      window.confirm = vi.fn().mockReturnValue(false)
      
      render(
        <PreferencesForm 
          endpoint="/api/newsletter/preferences"
          token="valid-token"
          showUnsubscribe={true}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /unsubscribe/i })).toBeInTheDocument()
      })
      
      await user.click(screen.getByRole('button', { name: /unsubscribe/i }))
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to unsubscribe from all emails?'
      )
      
      // Should not proceed if cancelled
      expect(fetch).toHaveBeenCalledTimes(1) // Only initial fetch
    })

    it('should handle unsubscribe request', async () => {
      const user = userEvent.setup()
      window.confirm = vi.fn().mockReturnValue(true)
      const onUnsubscribe = vi.fn()
      
      render(
        <PreferencesForm 
          endpoint="/api/newsletter/preferences"
          unsubscribeEndpoint="/api/newsletter/unsubscribe"
          token="valid-token"
          showUnsubscribe={true}
          onUnsubscribe={onUnsubscribe}
        />
      )
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /unsubscribe/i })).toBeInTheDocument()
      })
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Successfully unsubscribed' })
      } as Response)
      
      await user.click(screen.getByRole('button', { name: /unsubscribe/i }))
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/newsletter/unsubscribe', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json'
          }
        })
        
        expect(screen.getByText(/successfully unsubscribed/i)).toBeInTheDocument()
        expect(onUnsubscribe).toHaveBeenCalled()
      })
    })
  })

  describe('Form Validation', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, subscriber: mockSubscriber })
      } as Response)
    })

    it('should validate name length', async () => {
      const user = userEvent.setup()
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      const nameInput = screen.getByLabelText(/name/i)
      
      await user.clear(nameInput)
      await user.type(nameInput, 'a'.repeat(101))
      await user.click(screen.getByRole('button', { name: /save preferences/i }))
      
      expect(await screen.findByText(/name is too long/i)).toBeInTheDocument()
    })

    it('should require at least one email preference', async () => {
      const user = userEvent.setup()
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByLabelText(/newsletter/i)).toBeChecked()
      })
      
      // Uncheck all preferences
      await user.click(screen.getByLabelText(/newsletter/i))
      await user.click(screen.getByLabelText(/promotions/i))
      await user.click(screen.getByRole('button', { name: /save preferences/i }))
      
      expect(await screen.findByText(/select at least one email preference/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, subscriber: mockSubscriber })
      } as Response)
    })

    it('should have proper ARIA labels', async () => {
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      await waitFor(() => {
        const form = screen.getByRole('form')
        expect(form).toHaveAttribute('aria-label', 'Email preferences form')
      })
    })

    it('should group checkboxes properly', async () => {
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      await waitFor(() => {
        const fieldset = screen.getByRole('group', { name: /email preferences/i })
        expect(fieldset).toBeInTheDocument()
        
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes).toHaveLength(3)
      })
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      
      render(
        <PreferencesForm 
          apiEndpoint="/api/newsletter/preferences"
          sessionToken="valid-token"
        />
      )
      
      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      })
      
      // Tab through form
      await user.tab()
      expect(screen.getByLabelText(/name/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/newsletter/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/updates/i)).toHaveFocus()
    })
  })
})