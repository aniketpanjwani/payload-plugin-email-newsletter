'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { SerializedEditorState } from 'lexical'
import { convertToEmailSafeHtml, replacePersonalizationTags } from '../../utils/emailSafeHtml'
import { validateEmailHtml } from '../../utils/validateEmailHtml'
import type { NewsletterPluginConfig } from '../../types'
import { usePluginConfigOptional } from '../../contexts/PluginConfigContext'

interface EmailPreviewProps {
  content: SerializedEditorState | null
  subject: string
  preheader?: string
  mode?: 'desktop' | 'mobile'
  onValidation?: (result: { valid: boolean; warnings: string[]; errors: string[] }) => void
  pluginConfig?: NewsletterPluginConfig // Optional prop for direct config passing
}

const SAMPLE_DATA = {
  'subscriber.name': 'John Doe',
  'subscriber.firstName': 'John',
  'subscriber.lastName': 'Doe',
  'subscriber.email': 'john.doe@example.com',
}

const VIEWPORT_SIZES = {
  desktop: { width: 600, scale: 1 },
  mobile: { width: 320, scale: 0.8 },
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  content,
  subject,
  preheader,
  mode = 'desktop',
  onValidation,
  pluginConfig: propPluginConfig,
}) => {
  // Use plugin config from prop or context
  const contextPluginConfig = usePluginConfigOptional()
  const pluginConfig = propPluginConfig || contextPluginConfig
  const [html, setHtml] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateEmailHtml> | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Convert content to HTML whenever it changes
  useEffect(() => {
    const convertContent = async () => {
      if (!content) {
        setHtml('')
        return
      }

      setLoading(true)
      try {
        // Get email preview customization options
        const emailPreviewConfig = pluginConfig?.customizations?.broadcasts?.emailPreview
        
        // Convert to email-safe HTML with customization options
        const emailHtml = await convertToEmailSafeHtml(content, {
          wrapInTemplate: emailPreviewConfig?.wrapInTemplate ?? true,
          preheader,
          subject,
          customWrapper: emailPreviewConfig?.customWrapper,
          customBlockConverter: pluginConfig?.customizations?.broadcasts?.customBlockConverter,
        })

        // Replace personalization tags with sample data
        const personalizedHtml = replacePersonalizationTags(emailHtml, SAMPLE_DATA)

        // Add email header to the preview
        const previewHtml = addEmailHeader(personalizedHtml, {
          subject,
          from: 'Newsletter <noreply@example.com>',
          to: SAMPLE_DATA['subscriber.email'],
        })

        setHtml(previewHtml)

        // Validate the HTML
        const validation = validateEmailHtml(emailHtml)
        setValidationResult(validation)
        onValidation?.(validation)
      } catch (error) {
        console.error('Failed to convert content to HTML:', error)
        setHtml('<p>Error converting content to HTML</p>')
      } finally {
        setLoading(false)
      }
    }

    convertContent()
  }, [content, subject, preheader, onValidation, pluginConfig])

  // Update iframe content when HTML changes
  useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()
      }
    }
  }, [html])

  const viewport = VIEWPORT_SIZES[mode]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Validation Messages */}
      {validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          {validationResult.errors.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ color: '#dc2626', margin: '0 0 8px 0', fontSize: '14px' }}>
                Errors ({validationResult.errors.length})
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#dc2626' }}>
                {validationResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validationResult.warnings.length > 0 && (
            <div>
              <h4 style={{ color: '#d97706', margin: '0 0 8px 0', fontSize: '14px' }}>
                Warnings ({validationResult.warnings.length})
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#d97706' }}>
                {validationResult.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preview Frame */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        padding: '20px',
        overflow: 'auto',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <p>Loading preview...</p>
          </div>
        ) : html ? (
          <div style={{
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '8px',
            overflow: 'hidden',
            transform: `scale(${viewport.scale})`,
            transformOrigin: 'top center',
          }}>
            <iframe
              ref={iframeRef}
              title="Email Preview"
              style={{
                width: `${viewport.width}px`,
                height: '800px',
                border: 'none',
                display: 'block',
              }}
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <p>Start typing to see the email preview</p>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {validationResult && (
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid #e5e7eb',
          fontSize: '13px',
          color: '#6b7280',
          display: 'flex',
          gap: '24px',
        }}>
          <span>Size: {Math.round(validationResult.stats.sizeInBytes / 1024)}KB</span>
          <span>Links: {validationResult.stats.linkCount}</span>
          <span>Images: {validationResult.stats.imageCount}</span>
          <span>Viewport: {mode === 'desktop' ? '600px' : '320px'}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Add email header for preview
 */
function addEmailHeader(html: string, headers: {
  subject: string
  from: string
  to: string
}): string {
  const headerHtml = `
    <div style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 16px; font-family: monospace; font-size: 13px;">
      <div style="margin-bottom: 8px;"><strong>Subject:</strong> ${escapeHtml(headers.subject)}</div>
      <div style="margin-bottom: 8px;"><strong>From:</strong> ${escapeHtml(headers.from)}</div>
      <div><strong>To:</strong> ${escapeHtml(headers.to)}</div>
    </div>
  `

  // Insert header after <body> tag
  return html.replace(/<body[^>]*>/, `$&${headerHtml}`)
}

/**
 * Escape HTML for display
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}