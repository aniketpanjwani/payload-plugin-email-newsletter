import type { Endpoint, PayloadHandler } from 'payload'
import type { NewsletterPluginConfig } from '../types'

export const createSignoutEndpoint = (
  _config: NewsletterPluginConfig
): Endpoint => {
  return {
    path: '/newsletter/signout',
    method: 'post',
    handler: ((req: any, res: any) => {
      try {
        // Clear the auth cookie
        res.clearCookie('newsletter-auth', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })
        
        res.json({ 
          success: true, 
          message: 'Signed out successfully' 
        })
      } catch (error) {
        console.error('Signout error:', error)
        res.status(500).json({
          success: false,
          error: 'Failed to sign out',
        })
      }
    }) as PayloadHandler,
  }
}