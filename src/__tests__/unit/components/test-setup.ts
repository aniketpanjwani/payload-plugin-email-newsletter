/**
 * @vitest-environment happy-dom
 */

import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    search: '',
    hostname: 'localhost',
    pathname: '/',
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

beforeEach(() => {
  vi.clearAllMocks()
  // Reset fetch mock
  ;(global.fetch as any).mockReset()
})