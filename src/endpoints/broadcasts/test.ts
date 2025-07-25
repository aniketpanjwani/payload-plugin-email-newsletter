import type { Endpoint, PayloadHandler, PayloadRequest } from 'payload'
import type { NewsletterPluginConfig } from '../../types'
import { requireAdmin } from '../../utils/auth'
import { convertToEmailSafeHtml } from '../../utils/emailSafeHtml'

export const createTestBroadcastEndpoint = (
  config: NewsletterPluginConfig,
  collectionSlug: string
): Endpoint => {
  return {
    path: `/${collectionSlug}/:id/test`,
    method: 'post',
    handler: (async (req: PayloadRequest) => {
      try {
        // Check authentication
        const auth = await requireAdmin(req, config)
        if (!auth.authorized) {
          return Response.json({
            success: false,
            error: auth.error,
          }, { status: 401 })
        }

        // Get ID from URL
        const url = new URL(req.url || '', `http://localhost`)
        const pathParts = url.pathname.split('/')
        const id = pathParts[pathParts.length - 2] // -2 because last part is 'test'

        if (!id) {
          return Response.json({
            success: false,
            error: 'Broadcast ID is required',
          }, { status: 400 })
        }

        // Parse request body for optional test email
        const data = await (req.json?.() || Promise.resolve({}))
        const testEmail = data.email || auth.user.email

        if (!testEmail) {
          return Response.json({
            success: false,
            error: 'No email address available for test send',
          }, { status: 400 })
        }

        // Get the broadcast document
        const broadcast = await req.payload.findByID({
          collection: collectionSlug,
          id,
          user: auth.user,
        })

        if (!broadcast) {
          return Response.json({
            success: false,
            error: 'Broadcast not found',
          }, { status: 404 })
        }

        // Convert content to email-safe HTML
        const htmlContent = await convertToEmailSafeHtml(broadcast.content, {
          wrapInTemplate: true,
          preheader: broadcast.preheader,
        })

        // Get email service
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const emailService = (req.payload as any).newsletterEmailService
        if (!emailService) {
          return Response.json({
            success: false,
            error: 'Email service is not configured',
          }, { status: 500 })
        }

        // Get sender info from provider config
        const providerConfig = config.providers.default === 'resend' 
          ? config.providers.resend 
          : config.providers.broadcast
        const fromEmail = providerConfig?.fromAddress || providerConfig?.fromEmail || 'noreply@example.com'
        const fromName = providerConfig?.fromName || 'Newsletter'
        const replyTo = broadcast.settings?.replyTo || providerConfig?.replyTo

        // Send test email
        await emailService.send({
          to: testEmail,
          from: fromEmail,
          fromName: fromName,
          replyTo: replyTo,
          subject: `[TEST] ${broadcast.subject}`,
          html: htmlContent,
          trackOpens: false,
          trackClicks: false,
        })

        return Response.json({
          success: true,
          message: `Test email sent to ${testEmail}`,
        })
      } catch (error) {
        console.error('Failed to send test broadcast:', error)
        
        return Response.json({
          success: false,
          error: 'Failed to send test email',
        }, { status: 500 })
      }
    }) as PayloadHandler,
  }
}