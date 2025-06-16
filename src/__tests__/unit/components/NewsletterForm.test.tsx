/**
 * @vitest-environment happy-dom
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import './test-setup'
import { NewsletterForm } from '../../../components/NewsletterForm'

describe('NewsletterForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument()
    })

    it('should render with custom labels', () => {
      render(
        <NewsletterForm 
          endpoint="/api/newsletter/subscribe"
          labels={{
            email: 'Your Email Address',
            name: 'Full Name',
            submit: 'Join Newsletter'
          }}
        />
      )
      
      expect(screen.getByLabelText('Your Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Join Newsletter' })).toBeInTheDocument()
    })

    it('should render success message component', () => {
      render(
        <NewsletterForm 
          endpoint="/api/newsletter/subscribe"
          successMessage="Thanks for subscribing!"
        />
      )
      
      // Success message should not be visible initially
      expect(screen.queryByText('Thanks for subscribing!')).not.toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      
      // Invalid email
      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)
      
      expect(await screen.findByText(/invalid email/i)).toBeInTheDocument()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should require email field', async () => {
      const user = userEvent.setup()
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      
      // Submit without email
      await user.click(submitButton)
      
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should trim whitespace from email', async () => {
      const user = userEvent.setup()
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      
      await user.type(emailInput, '  user@example.com  ')
      
      expect(emailInput).toHaveValue('  user@example.com  ')
      
      // After blur, should be trimmed
      fireEvent.blur(emailInput)
      expect(emailInput).toHaveValue('user@example.com')
    })

    it('should validate name length if provided', async () => {
      const user = userEvent.setup()
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const nameInput = screen.getByLabelText(/name/i)
      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      
      // Name too long
      await user.type(nameInput, 'a'.repeat(101))
      await user.click(submitButton)
      
      expect(await screen.findByText(/name is too long/i)).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should submit valid form data', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)
      
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const nameInput = screen.getByLabelText(/name/i)
      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      
      await user.type(emailInput, 'user@example.com')
      await user.type(nameInput, 'John Doe')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'user@example.com',
            name: 'John Doe'
          })
        })
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      
      // Mock slow response
      vi.mocked(fetch).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        } as Response), 100))
      )
      
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      
      await user.type(emailInput, 'user@example.com')
      await user.click(submitButton)
      
      // Should show loading state
      expect(screen.getByRole('button', { name: /subscribing/i })).toBeDisabled()
      
      // Wait for completion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /subscribe/i })).not.toBeDisabled()
      })
    })

    it('should handle submission success', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Check your email!' })
      } as Response)
      
      render(
        <NewsletterForm 
          endpoint="/api/newsletter/subscribe"
          onSuccess={onSuccess}
          successMessage="Thanks for subscribing!"
        />
      )
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'user@example.com')
      await user.click(screen.getByRole('button', { name: /subscribe/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Thanks for subscribing!')).toBeInTheDocument()
        expect(onSuccess).toHaveBeenCalledWith({ 
          success: true, 
          message: 'Check your email!' 
        })
      })
      
      // Form should be reset
      expect(emailInput).toHaveValue('')
    })

    it('should handle submission errors', async () => {
      const user = userEvent.setup()
      const onError = vi.fn()
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'Email already subscribed' })
      } as Response)
      
      render(
        <NewsletterForm 
          endpoint="/api/newsletter/subscribe"
          onError={onError}
        />
      )
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'existing@example.com')
      await user.click(screen.getByRole('button', { name: /subscribe/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Email already subscribed')).toBeInTheDocument()
        expect(onError).toHaveBeenCalledWith('Email already subscribed')
      })
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
      
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'user@example.com')
      await user.click(screen.getByRole('button', { name: /subscribe/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Additional Features', () => {
    it('should include source parameter if provided', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)
      
      render(
        <NewsletterForm 
          endpoint="/api/newsletter/subscribe"
          source="homepage-footer"
        />
      )
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'user@example.com')
      await user.click(screen.getByRole('button', { name: /subscribe/i }))
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/newsletter/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'user@example.com',
            name: '',
            source: 'homepage-footer'
          })
        })
      })
    })

    it('should include utm parameters if available', async () => {
      const user = userEvent.setup()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response)
      
      // Mock URL search params
      const originalLocation = window.location
      delete (window as any).location
      window.location = {
        ...originalLocation,
        search: '?utm_source=google&utm_medium=cpc&utm_campaign=summer'
      }
      
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'user@example.com')
      await user.click(screen.getByRole('button', { name: /subscribe/i }))
      
      await waitFor(() => {
        const call = vi.mocked(fetch).mock.calls[0]
        const body = JSON.parse(call[1]?.body as string)
        expect(body.metadata?.utm).toEqual({
          source: 'google',
          medium: 'cpc',
          campaign: 'summer'
        })
      })
      
      // Restore location
      window.location = originalLocation
    })

    it('should support custom CSS classes', () => {
      render(
        <NewsletterForm 
          endpoint="/api/newsletter/subscribe"
          className="custom-form"
          fieldClassName="custom-field"
          buttonClassName="custom-button"
        />
      )
      
      const form = screen.getByRole('form')
      expect(form).toHaveClass('custom-form')
      
      const button = screen.getByRole('button', { name: /subscribe/i })
      expect(button).toHaveClass('custom-button')
    })

    it('should prevent multiple submissions', async () => {
      const user = userEvent.setup()
      
      // Mock slow response
      vi.mocked(fetch).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        } as Response), 1000))
      )
      
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      
      await user.type(emailInput, 'user@example.com')
      
      // Click multiple times
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)
      
      // Should only call fetch once
      expect(fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('aria-label', 'Newsletter subscription form')
      
      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      
      const nameInput = screen.getByLabelText(/name/i)
      expect(nameInput).toHaveAttribute('type', 'text')
    })

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      const submitButton = screen.getByRole('button', { name: /subscribe/i })
      await user.click(submitButton)
      
      const errorMessage = await screen.findByText(/email is required/i)
      expect(errorMessage).toHaveAttribute('role', 'alert')
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<NewsletterForm endpoint="/api/newsletter/subscribe" />)
      
      // Tab through form
      await user.tab()
      expect(screen.getByLabelText(/email/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText(/name/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /subscribe/i })).toHaveFocus()
    })
  })
})