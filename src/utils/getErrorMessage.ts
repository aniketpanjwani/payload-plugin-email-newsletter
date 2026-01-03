import { BroadcastProviderError } from '../types/broadcast'

/**
 * Extract error message from unknown error type.
 * Provides proper type narrowing for error handling.
 *
 * @param error - Unknown error value from catch block
 * @returns Human-readable error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof BroadcastProviderError) {
    return `${error.code}: ${error.message}`
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * Extract structured error info for logging.
 * Provides consistent error object shape for pino logger.
 *
 * @param error - Unknown error value from catch block
 * @returns Structured error object for logging
 */
export function getErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(error instanceof BroadcastProviderError ? { code: error.code } : {}),
    }
  }
  return { message: String(error) }
}
