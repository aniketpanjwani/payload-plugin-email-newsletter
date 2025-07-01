import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig, ExtendedPayloadRequest } from '../types'

export const createSignoutEndpoint = (
  _config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/signout',
    method: 'post',
    handler: ((_req: ExtendedPayloadRequest) => {
      try {
        // In Payload v3, cookies are handled differently
        // The Response object doesn't have a clearCookie method
        // We'll need to set the cookie with an expired date
        const headers = new Headers()
        headers.append('Set-Cookie', `newsletter-auth=; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Path=/; Max-Age=0`)
        
        return Response.json({ 
          success: true, 
          message: 'Signed out successfully' 
        }, { headers })
      } catch (error) {
        console.error('Signout error:', error)
        return Response.json({
          success: false,
          error: 'Failed to sign out',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}