export interface RateLimiterOptions {
  maxAttempts: number
  windowMs: number
  prefix?: string
}

export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()
  private options: RateLimiterOptions

  constructor(options: RateLimiterOptions) {
    this.options = options
  }

  async checkLimit(key: string): Promise<boolean> {
    const now = Date.now()
    const record = this.attempts.get(key)

    if (!record || record.resetTime < now) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.options.windowMs
      })
      return true
    }

    if (record.count >= this.options.maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  async incrementAttempt(key: string): Promise<void> {
    const now = Date.now()
    const record = this.attempts.get(key)

    if (!record || record.resetTime < now) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + this.options.windowMs
      })
    } else {
      record.count++
    }
  }

  async reset(key: string): Promise<void> {
    this.attempts.delete(key)
  }

  async resetAll(): Promise<void> {
    this.attempts.clear()
  }
}