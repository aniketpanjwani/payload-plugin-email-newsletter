import DOMPurify from 'isomorphic-dompurify'
import type { SerializedEditorState } from 'lexical'

/**
 * DOMPurify configuration for email-safe HTML
 */
export const EMAIL_SAFE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'span',
    'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'hr',
    'img', 'div', 'table', 'tr', 'td', 'th', 'tbody', 'thead'
  ],
  ALLOWED_ATTR: ['href', 'style', 'target', 'rel', 'align', 'src', 'alt', 'width', 'height', 'border', 'cellpadding', 'cellspacing'],
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
  editorState: SerializedEditorState | undefined | null,
  options?: {
    wrapInTemplate?: boolean
    preheader?: string
    mediaUrl?: string // Base URL for media files
    customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
    payload?: any // Payload instance for populating relationships
    populateFields?: string[] | ((blockType: string) => string[]) // Fields to populate
  }
): Promise<string> {
  // Handle empty content
  if (!editorState) {
    return ''
  }
  
  // First, convert Lexical state to HTML using custom converters
  const rawHtml = await lexicalToEmailHtml(editorState, options?.mediaUrl, options?.customBlockConverter)
  
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
async function lexicalToEmailHtml(
  editorState: SerializedEditorState, 
  mediaUrl?: string,
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
): Promise<string> {
  const { root } = editorState
  
  if (!root || !root.children) {
    return ''
  }
  
  // Convert nodes asynchronously to support custom converters
  const htmlParts = await Promise.all(
    root.children.map((node: any) => convertNode(node, mediaUrl, customBlockConverter))
  )
  
  return htmlParts.join('')
}

/**
 * Convert individual Lexical nodes to email-safe HTML
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertNode(
  node: any, 
  mediaUrl?: string,
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
): Promise<string> {
  switch (node.type) {
    case 'paragraph':
      return convertParagraph(node, mediaUrl, customBlockConverter)
    case 'heading':
      return convertHeading(node, mediaUrl, customBlockConverter)
    case 'list':
      return convertList(node, mediaUrl, customBlockConverter)
    case 'listitem':
      return convertListItem(node, mediaUrl, customBlockConverter)
    case 'blockquote':
      return convertBlockquote(node, mediaUrl, customBlockConverter)
    case 'text':
      return convertText(node)
    case 'link':
      return convertLink(node, mediaUrl, customBlockConverter)
    case 'linebreak':
      return '<br>'
    case 'upload':
      return convertUpload(node, mediaUrl)
    case 'block':
      return await convertBlock(node, mediaUrl, customBlockConverter)
    default:
      // Unknown node type - convert children if any
      if (node.children) {
        const childParts = await Promise.all(
          node.children.map((child: any) => convertNode(child, mediaUrl, customBlockConverter))
        )
        return childParts.join('')
      }
      return ''
  }
}

/**
 * Convert paragraph node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertParagraph(
  node: any, 
  mediaUrl?: string,
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
): Promise<string> {
  const align = getAlignment(node.format)
  const childParts = await Promise.all(
    (node.children || []).map((child: any) => convertNode(child, mediaUrl, customBlockConverter))
  )
  const children = childParts.join('')
  
  if (!children.trim()) {
    return '<p style="margin: 0 0 16px 0; min-height: 1em;">&nbsp;</p>'
  }
  
  return `<p style="margin: 0 0 16px 0; text-align: ${align};">${children}</p>`
}

/**
 * Convert heading node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertHeading(
  node: any, 
  mediaUrl?: string,
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
): Promise<string> {
  const tag = node.tag || 'h1'
  const align = getAlignment(node.format)
  const childParts = await Promise.all(
    (node.children || []).map((child: any) => convertNode(child, mediaUrl, customBlockConverter))
  )
  const children = childParts.join('')
  
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertList(
  node: any, 
  mediaUrl?: string,
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
): Promise<string> {
  const tag = node.listType === 'number' ? 'ol' : 'ul'
  const childParts = await Promise.all(
    (node.children || []).map((child: any) => convertNode(child, mediaUrl, customBlockConverter))
  )
  const children = childParts.join('')
  
  const style = tag === 'ul' 
    ? 'margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc;'
    : 'margin: 0 0 16px 0; padding-left: 24px; list-style-type: decimal;'
  
  return `<${tag} style="${style}">${children}</${tag}>`
}

/**
 * Convert list item node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertListItem(
  node: any, 
  mediaUrl?: string,
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
): Promise<string> {
  const childParts = await Promise.all(
    (node.children || []).map((child: any) => convertNode(child, mediaUrl, customBlockConverter))
  )
  const children = childParts.join('')
  return `<li style="margin: 0 0 8px 0;">${children}</li>`
}

/**
 * Convert blockquote node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertBlockquote(
  node: any, 
  mediaUrl?: string,
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
): Promise<string> {
  const childParts = await Promise.all(
    (node.children || []).map((child: any) => convertNode(child, mediaUrl, customBlockConverter))
  )
  const children = childParts.join('')
  const style = 'margin: 0 0 16px 0; padding-left: 16px; border-left: 4px solid #e5e7eb; color: #6b7280;'
  
  return `<blockquote style="${style}">${children}</blockquote>`
}

/**
 * Convert text node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertLink(
  node: any, 
  mediaUrl?: string,
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
): Promise<string> {
  const childParts = await Promise.all(
    (node.children || []).map((child: any) => convertNode(child, mediaUrl, customBlockConverter))
  )
  const children = childParts.join('')
  const url = node.fields?.url || '#'
  const newTab = node.fields?.newTab ?? false
  
  // Add target and rel attributes based on newTab setting
  const targetAttr = newTab ? ' target="_blank"' : ''
  const relAttr = newTab ? ' rel="noopener noreferrer"' : ''
  
  return `<a href="${escapeHtml(url)}"${targetAttr}${relAttr} style="color: #2563eb; text-decoration: underline;">${children}</a>`
}

/**
 * Convert upload (image) node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertUpload(node: any, mediaUrl?: string): string {
  const upload = node.value
  if (!upload) return ''
  
  // Get image URL - handle both direct URL and media object
  let src = ''
  if (typeof upload === 'string') {
    src = upload
  } else if (upload.url) {
    src = upload.url
  } else if (upload.filename && mediaUrl) {
    // Construct URL from media URL and filename
    src = `${mediaUrl}/${upload.filename}`
  }
  
  const alt = node.fields?.altText || upload.alt || ''
  const caption = node.fields?.caption || ''
  
  // Email-safe image with max-width for responsiveness
  const imgHtml = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />`
  
  if (caption) {
    return `
      <div style="margin: 0 0 16px 0; text-align: center;">
        ${imgHtml}
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280; font-style: italic;">${escapeHtml(caption)}</p>
      </div>
    `
  }
  
  return `<div style="margin: 0 0 16px 0; text-align: center;">${imgHtml}</div>`
}

/**
 * Convert custom block node
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function convertBlock(
  node: any, 
  mediaUrl?: string,
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
): Promise<string> {
  const blockType = node.fields?.blockName || node.blockName
  
  // First, check if there's a custom converter for this block
  if (customBlockConverter) {
    try {
      const customHtml = await customBlockConverter(node, mediaUrl)
      if (customHtml) {
        return customHtml
      }
    } catch (error) {
      console.error(`Custom block converter error for ${blockType}:`, error)
      // Fall through to default handling
    }
  }
  
  // Default handling for built-in blocks
  switch (blockType) {
    case 'button':
      return convertButtonBlock(node.fields)
    case 'divider':
      return convertDividerBlock(node.fields)
    default:
      // Unknown block type - try to convert children
      if (node.children) {
        const childParts = await Promise.all(
          node.children.map((child: any) => convertNode(child, mediaUrl, customBlockConverter))
        )
        return childParts.join('')
      }
      return ''
  }
}

/**
 * Convert button block
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertButtonBlock(fields: any): string {
  const text = fields?.text || 'Click here'
  const url = fields?.url || '#'
  const style = fields?.style || 'primary'
  
  const styles: Record<string, string> = {
    primary: 'background-color: #2563eb; color: #ffffff; border: 2px solid #2563eb;',
    secondary: 'background-color: #6b7280; color: #ffffff; border: 2px solid #6b7280;',
    outline: 'background-color: transparent; color: #2563eb; border: 2px solid #2563eb;',
  }
  
  const buttonStyle = `${styles[style] || styles.primary} display: inline-block; padding: 12px 24px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; text-align: center;`
  
  return `
    <div style="margin: 0 0 16px 0; text-align: center;">
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="${buttonStyle}">${escapeHtml(text)}</a>
    </div>
  `
}

/**
 * Convert divider block
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDividerBlock(fields: any): string {
  const style = fields?.style || 'solid'
  
  const styles: Record<string, string> = {
    solid: 'border-top: 1px solid #e5e7eb;',
    dashed: 'border-top: 1px dashed #e5e7eb;',
    dotted: 'border-top: 1px dotted #e5e7eb;',
  }
  
  return `<hr style="${styles[style] || styles.solid} margin: 24px 0; border-bottom: none; border-left: none; border-right: none;" />`
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