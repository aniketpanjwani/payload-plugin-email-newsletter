import DOMPurify from 'isomorphic-dompurify'
import type { SerializedEditorState } from 'lexical'

/**
 * DOMPurify configuration for email-safe HTML
 */
export const EMAIL_SAFE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'span',
    'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'hr'
  ],
  ALLOWED_ATTR: ['href', 'style', 'target', 'rel', 'align'],
  ALLOWED_STYLES: {
    '*': [
      'color', 'background-color', 'font-size', 'font-weight',
      'font-style', 'text-decoration', 'text-align', 'margin',
      'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 
      'padding-left', 'line-height', 'border-left', 'border-left-width',
      'border-left-style', 'border-left-color'
    ],
  },
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['class', 'id', 'onclick', 'onload', 'onerror'],
}

/**
 * Converts Lexical editor state to email-safe HTML
 */
export async function convertToEmailSafeHtml(
  editorState: SerializedEditorState,
  options?: {
    wrapInTemplate?: boolean
    preheader?: string
  }
): Promise<string> {
  // First, convert Lexical state to HTML using custom converters
  const rawHtml = await lexicalToEmailHtml(editorState)
  
  // Sanitize the HTML
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, EMAIL_SAFE_CONFIG)
  
  // Optionally wrap in email template
  if (options?.wrapInTemplate) {
    return wrapInEmailTemplate(sanitizedHtml, options.preheader)
  }
  
  return sanitizedHtml
}

/**
 * Custom Lexical to HTML converter for email
 */
async function lexicalToEmailHtml(editorState: SerializedEditorState): Promise<string> {
  const { root } = editorState
  
  if (!root || !root.children) {
    return ''
  }
  
  const html = root.children.map((node: any) => convertNode(node)).join('')
  return html
}

/**
 * Convert individual Lexical nodes to email-safe HTML
 */
function convertNode(node: any): string {
  switch (node.type) {
    case 'paragraph':
      return convertParagraph(node)
    case 'heading':
      return convertHeading(node)
    case 'list':
      return convertList(node)
    case 'listitem':
      return convertListItem(node)
    case 'blockquote':
      return convertBlockquote(node)
    case 'text':
      return convertText(node)
    case 'link':
      return convertLink(node)
    case 'linebreak':
      return '<br>'
    default:
      // Unknown node type - convert children if any
      if (node.children) {
        return node.children.map(convertNode).join('')
      }
      return ''
  }
}

/**
 * Convert paragraph node
 */
function convertParagraph(node: any): string {
  const align = getAlignment(node.format)
  const children = node.children?.map(convertNode).join('') || ''
  
  if (!children.trim()) {
    return '<p style="margin: 0 0 16px 0; min-height: 1em;">&nbsp;</p>'
  }
  
  return `<p style="margin: 0 0 16px 0; text-align: ${align};">${children}</p>`
}

/**
 * Convert heading node
 */
function convertHeading(node: any): string {
  const tag = node.tag || 'h1'
  const align = getAlignment(node.format)
  const children = node.children?.map(convertNode).join('') || ''
  
  const styles: Record<string, string> = {
    h1: 'font-size: 32px; font-weight: 700; margin: 0 0 24px 0; line-height: 1.2;',
    h2: 'font-size: 24px; font-weight: 600; margin: 0 0 16px 0; line-height: 1.3;',
    h3: 'font-size: 20px; font-weight: 600; margin: 0 0 12px 0; line-height: 1.4;',
  }
  
  const style = `${styles[tag] || styles.h3} text-align: ${align};`
  
  return `<${tag} style="${style}">${children}</${tag}>`
}

/**
 * Convert list node
 */
function convertList(node: any): string {
  const tag = node.listType === 'number' ? 'ol' : 'ul'
  const children = node.children?.map(convertNode).join('') || ''
  
  const style = tag === 'ul' 
    ? 'margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;'
    : 'margin: 0 0 16px 0; padding-left: 24px; list-style-type: decimal;'
  
  return `<${tag} style="${style}">${children}</${tag}>`
}

/**
 * Convert list item node
 */
function convertListItem(node: any): string {
  const children = node.children?.map(convertNode).join('') || ''
  return `<li style="margin: 0 0 8px 0;">${children}</li>`
}

/**
 * Convert blockquote node
 */
function convertBlockquote(node: any): string {
  const children = node.children?.map(convertNode).join('') || ''
  const style = 'margin: 0 0 16px 0; padding-left: 16px; border-left: 4px solid #e5e7eb; color: #6b7280;'
  
  return `<blockquote style="${style}">${children}</blockquote>`
}

/**
 * Convert text node
 */
function convertText(node: any): string {
  let text = escapeHtml(node.text || '')
  
  // Apply formatting
  if (node.format & 1) { // Bold
    text = `<strong>${text}</strong>`
  }
  if (node.format & 2) { // Italic
    text = `<em>${text}</em>`
  }
  if (node.format & 8) { // Underline
    text = `<u>${text}</u>`
  }
  if (node.format & 4) { // Strikethrough
    text = `<strike>${text}</strike>`
  }
  
  return text
}

/**
 * Convert link node
 */
function convertLink(node: any): string {
  const children = node.children?.map(convertNode).join('') || ''
  const url = node.fields?.url || '#'
  
  // Ensure links open in new tab and have security attributes
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${children}</a>`
}

/**
 * Get text alignment from format number
 */
function getAlignment(format?: number): string {
  if (!format) return 'left'
  
  // Lexical alignment format values
  if (format & 2) return 'center'
  if (format & 3) return 'right'
  if (format & 4) return 'justify'
  
  return 'left'
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  
  return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Wrap content in a basic email template
 */
function wrapInEmailTemplate(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #333333; background-color: #f3f4f6;">
  ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${escapeHtml(preheader)}</div>` : ''}
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 0;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Extract personalization tags from content
 */
export function extractPersonalizationTags(html: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const tags: string[] = []
  let match
  
  while ((match = regex.exec(html)) !== null) {
    tags.push(match[1].trim())
  }
  
  return [...new Set(tags)]
}

/**
 * Replace personalization tags with sample data
 */
export function replacePersonalizationTags(
  html: string, 
  sampleData: Record<string, string>
): string {
  return html.replace(/\{\{([^}]+)\}\}/g, (match, tag) => {
    const trimmedTag = tag.trim()
    return sampleData[trimmedTag] || match
  })
}