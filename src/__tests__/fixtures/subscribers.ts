export const mockSubscribers = [
  {
    id: 'sub-1',
    email: 'active@example.com',
    name: 'Active Subscriber',
    locale: 'en',
    subscriptionStatus: 'active',
    emailPreferences: {
      newsletter: true,
      announcements: true,
    },
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: 'sub-2',
    email: 'pending@example.com',
    name: 'Pending Subscriber',
    locale: 'en',
    subscriptionStatus: 'pending',
    emailPreferences: {
      newsletter: true,
      announcements: true,
    },
    createdAt: new Date('2024-01-02').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
  },
  {
    id: 'sub-3',
    email: 'unsubscribed@example.com',
    name: 'Former Subscriber',
    locale: 'en',
    subscriptionStatus: 'unsubscribed',
    unsubscribedAt: new Date('2024-01-10').toISOString(),
    emailPreferences: {
      newsletter: false,
      announcements: false,
    },
    createdAt: new Date('2024-01-03').toISOString(),
    updatedAt: new Date('2024-01-10').toISOString(),
  },
]

export const createMockSubscriber = (overrides: any = {}) => {
  return {
    id: `sub-${Date.now()}`,
    email: 'test@example.com',
    name: 'Test Subscriber',
    locale: 'en',
    subscriptionStatus: 'pending',
    emailPreferences: {
      newsletter: true,
      announcements: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

export const mockMagicLinkTokenData = {
  subscriberId: 'sub-1',
  email: 'active@example.com',
  action: 'verify' as const,
}

export const mockPreferencesTokenData = {
  subscriberId: 'sub-1',
  email: 'active@example.com',
  action: 'preferences' as const,
}