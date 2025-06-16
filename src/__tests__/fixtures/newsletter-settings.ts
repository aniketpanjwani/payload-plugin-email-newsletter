export const mockNewsletterSettings = {
  id: 'settings-1',
  name: 'Test Configuration',
  active: true,
  provider: 'resend',
  resendSettings: {
    apiKey: 'test-api-key',
    audienceIds: [],
  },
  from: {
    email: 'newsletter@example.com',
    name: 'Test Newsletter',
  },
  // Settings directly on object, not nested
  requireDoubleOptIn: true,
  allowedDomains: [],
  maxSubscribersPerIP: 10,
  emailTemplates: {
    welcome: {
      enabled: true,
      subject: 'Welcome to Our Newsletter',
      preheader: 'Thank you for subscribing!',
    },
    magicLink: {
      subject: 'Sign in to {{fromName}}',
      preheader: 'Click the link to access your preferences',
      expirationTime: '7d',
    },
  },
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
}

export const createMockSettings = (overrides: any = {}) => {
  return {
    ...mockNewsletterSettings,
    ...overrides,
  }
}