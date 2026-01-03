/**
 * Simple in-memory idempotency tracking for provider operations.
 * Prevents duplicate API calls when database updates fail after successful provider calls.
 *
 * Keys expire after TTL to allow retries after reasonable time.
 */

interface IdempotencyEntry {
  completedAt: number
  result: unknown
}

// In-memory store for completed operations
const completedOperations = new Map<string, IdempotencyEntry>()

// Default TTL: 5 minutes (operations older than this can be retried)
const DEFAULT_TTL_MS = 5 * 60 * 1000

/**
 * Generate an idempotency key for a provider operation.
 *
 * @param broadcastId - The broadcast document ID
 * @param operation - The operation type (schedule, send, cancel)
 * @param params - Operation-specific parameters (e.g., scheduledAt timestamp)
 * @returns A unique key for this operation
 */
export function generateIdempotencyKey(
  broadcastId: string,
  operation: 'schedule' | 'send' | 'cancel',
  params?: Record<string, string | number>
): string {
  const paramStr = params ? Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&') : ''
  return `${broadcastId}:${operation}:${paramStr}`
}

/**
 * Check if an operation was recently completed successfully.
 * Used to prevent duplicate provider calls after DB update failures.
 *
 * @param key - Idempotency key from generateIdempotencyKey
 * @param ttlMs - Time-to-live in milliseconds (default: 5 minutes)
 * @returns The cached result if operation was recently completed, undefined otherwise
 */
export function getCompletedOperation<T = unknown>(
  key: string,
  ttlMs: number = DEFAULT_TTL_MS
): T | undefined {
  const entry = completedOperations.get(key)

  if (!entry) {
    return undefined
  }

  // Check if expired
  if (Date.now() - entry.completedAt > ttlMs) {
    completedOperations.delete(key)
    return undefined
  }

  return entry.result as T
}

/**
 * Mark an operation as completed.
 * Call this after a successful provider operation.
 *
 * @param key - Idempotency key from generateIdempotencyKey
 * @param result - The result to cache
 */
export function markOperationCompleted(key: string, result: unknown): void {
  completedOperations.set(key, {
    completedAt: Date.now(),
    result,
  })

  // Cleanup old entries periodically (every 100 operations)
  if (completedOperations.size > 100) {
    cleanupExpiredEntries()
  }
}

/**
 * Clear a specific idempotency key.
 * Useful when you want to allow a retry.
 *
 * @param key - Idempotency key to clear
 */
export function clearIdempotencyKey(key: string): void {
  completedOperations.delete(key)
}

/**
 * Remove expired entries from the cache.
 */
function cleanupExpiredEntries(ttlMs: number = DEFAULT_TTL_MS): void {
  const now = Date.now()
  for (const [key, entry] of completedOperations.entries()) {
    if (now - entry.completedAt > ttlMs) {
      completedOperations.delete(key)
    }
  }
}

/**
 * Clear all idempotency tracking (useful for testing).
 */
export function clearAllIdempotencyKeys(): void {
  completedOperations.clear()
}
