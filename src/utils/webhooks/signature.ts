import crypto from 'crypto'

/**
 * Verify Broadcast webhook signature
 * 
 * Broadcast signature format: "v1,base64signature"
 * Signed payload: timestamp + "." + body
 * Method: HMAC-SHA256
 */
export function verifyBroadcastWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string
): boolean {
  try {
    // Check timestamp validity (5 minute window)
    const now = Math.floor(Date.now() / 1000)
    const webhookTimestamp = parseInt(timestamp, 10)
    
    if (isNaN(webhookTimestamp)) {
      console.error('[Webhook Signature] Invalid timestamp format')
      return false
    }
    
    // Reject if timestamp is more than 5 minutes old
    if (Math.abs(now - webhookTimestamp) > 300) {
      console.error('[Webhook Signature] Timestamp too old or in future')
      return false
    }
    
    // Extract signature version and value
    const signatureParts = signature.split(',')
    if (signatureParts.length !== 2 || signatureParts[0] !== 'v1') {
      console.error('[Webhook Signature] Invalid signature format')
      return false
    }
    
    const actualSignature = signatureParts[1]
    
    // Create expected signature
    const signedPayload = `${timestamp}.${payload}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('base64')
    
    // Use timing-safe comparison
    const actualBuffer = Buffer.from(actualSignature)
    const expectedBuffer = Buffer.from(expectedSignature)
    
    if (actualBuffer.length !== expectedBuffer.length) {
      return false
    }
    
    return crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  } catch (error) {
    console.error('[Webhook Signature] Verification error:', error)
    return false
  }
}

/**
 * Extract webhook headers from request
 */
export function extractWebhookHeaders(req: Request): {
  signature?: string
  timestamp?: string
} {
  const signature = req.headers.get('x-broadcast-signature') || undefined
  const timestamp = req.headers.get('x-broadcast-timestamp') || undefined
  
  return { signature, timestamp }
}