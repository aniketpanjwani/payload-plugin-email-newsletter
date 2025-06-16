import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.PAYLOAD_SECRET = 'test-payload-secret'

// Happy DOM Timer Patch - Fix timer issues with Vitest
// According to Happy DOM docs, Vitest doesn't use Happy DOM's timer implementation by default
// This causes issues with React component tests that use timers
if (globalThis.window && globalThis.document) {
  // Access the Happy DOM window instance
  const happyWindow = (globalThis.document as any).defaultView || (globalThis.document as any).window
  
  if (happyWindow) {
    // Replace Node.js timers with Happy DOM's timers
    globalThis.setTimeout = happyWindow.setTimeout.bind(happyWindow)
    globalThis.clearTimeout = happyWindow.clearTimeout.bind(happyWindow)
    globalThis.setInterval = happyWindow.setInterval.bind(happyWindow)
    globalThis.clearInterval = happyWindow.clearInterval.bind(happyWindow)
    globalThis.requestAnimationFrame = happyWindow.requestAnimationFrame.bind(happyWindow)
    globalThis.cancelAnimationFrame = happyWindow.cancelAnimationFrame.bind(happyWindow)
  }
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
}

// Mock window.location for browser-like tests
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    search: '',
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

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockReset()
  localStorageMock.setItem.mockReset()
  localStorageMock.removeItem.mockReset()
  localStorageMock.clear.mockReset()
})