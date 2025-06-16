import { vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { MongoMemoryServer } from 'mongodb-memory-server'

// MongoDB Memory Server instance
let mongoServer: MongoMemoryServer | undefined

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.PAYLOAD_SECRET = 'test-payload-secret'
// Node env is set by vitest config

// Setup MongoDB Memory Server
beforeAll(async () => {
  if (process.env.TEST_USE_MONGODB_MEMORY_SERVER === 'true') {
    mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    process.env.DATABASE_URI = mongoUri
  }
})

// Cleanup MongoDB Memory Server
afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop()
  }
})

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

// Suppress console logs in tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }
}