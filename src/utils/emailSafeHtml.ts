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
    customWrapper?: (content: string, options?: { preheader?: string; subject?: string; documentData?: Record<string, any> }) => string | Promise<string>
    subject?: string // Email subject for custom wrapper
    documentData?: Record<string, any> // Generic document data for custom wrapper
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
    if (options.customWrapper) {
      return await Promise.resolve(options.customWrapper(sanitizedHtml, { 
        preheader: options.preheader,
        subject: options.subject,
        documentData: options.documentData
      }))
    }
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
    return '<p class="mobile-margin-bottom-16" style="margin: 0 0 16px 0; min-height: 1em;">&nbsp;</p>'
  }
  
  return `<p class="mobile-margin-bottom-16" style="margin: 0 0 16px 0; text-align: ${align}; font-size: 16px; line-height: 1.5;">${children}</p>`
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
  
  const mobileClasses: Record<string, string> = {
    h1: 'mobile-font-size-24',
    h2: 'mobile-font-size-20',
    h3: 'mobile-font-size-16',
  }
  
  const style = `${styles[tag] || styles.h3} text-align: ${align};`
  const mobileClass = mobileClasses[tag] || mobileClasses.h3
  
  return `<${tag} class="${mobileClass}" style="${style}">${children}</${tag}>`
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
    ? 'margin: 0 0 16px 0; padding-left: 24px; list-style-type: disc; font-size: 16px; line-height: 1.5;'
    : 'margin: 0 0 16px 0; padding-left: 24px; list-style-type: decimal; font-size: 16px; line-height: 1.5;'
  
  return `<${tag} class="mobile-margin-bottom-16" style="${style}">${children}</${tag}>`
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
  
  // Responsive email-safe image
  const imgHtml = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="mobile-width-100" style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 6px;" />`
  
  if (caption) {
    return `
      <div style="margin: 0 0 16px 0; text-align: center;" class="mobile-margin-bottom-16">
        ${imgHtml}
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280; font-style: italic; text-align: center;" class="mobile-font-size-14">${escapeHtml(caption)}</p>
      </div>
    `
  }
  
  return `<div style="margin: 0 0 16px 0; text-align: center;" class="mobile-margin-bottom-16">${imgHtml}</div>`
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
 * Wrap content in a responsive email template
 */
function wrapInEmailTemplate(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Newsletter</title>
  
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  
  <style>
    /* Reset and base styles */
    * {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    body {
      margin: 0 !important;
      padding: 0 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: #1A1A1A;
      background-color: #f8f9fa;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    
    table table table {
      table-layout: auto;
    }
    
    img {
      -ms-interpolation-mode: bicubic;
      max-width: 100%;
      height: auto;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    
    /* Responsive styles */
    @media only screen and (max-width: 640px) {
      .mobile-hide {
        display: none !important;
      }
      
      .mobile-center {
        text-align: center !important;
      }
      
      .mobile-width-100 {
        width: 100% !important;
        max-width: 100% !important;
      }
      
      .mobile-padding {
        padding: 20px !important;
      }
      
      .mobile-padding-sm {
        padding: 16px !important;
      }
      
      .mobile-font-size-14 {
        font-size: 14px !important;
      }
      
      .mobile-font-size-16 {
        font-size: 16px !important;
      }
      
      .mobile-font-size-20 {
        font-size: 20px !important;
        line-height: 1.3 !important;
      }
      
      .mobile-font-size-24 {
        font-size: 24px !important;
        line-height: 1.2 !important;
      }
      
      /* Stack sections on mobile */
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
      
      /* Mobile-specific spacing */
      .mobile-margin-bottom-16 {
        margin-bottom: 16px !important;
      }
      
      .mobile-margin-bottom-20 {
        margin-bottom: 20px !important;
      }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg {
        background-color: #1a1a1a !important;
      }
      
      .dark-mode-text {
        color: #ffffff !important;
      }
      
      .dark-mode-border {
        border-color: #333333 !important;
      }
    }
    
    /* Outlook-specific fixes */
    <!--[if mso]>
    <style>
      table {
        border-collapse: collapse;
        border-spacing: 0;
        border: none;
        margin: 0;
      }
      
      div, p {
        margin: 0;
      }
    </style>
    <![endif]-->
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #1A1A1A; background-color: #f8f9fa;">
  ${preheader ? `
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: transparent;">
    ${escapeHtml(preheader)}
  </div>
  ` : ''}
  
  <!-- Main container -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 0; background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <!-- Email wrapper -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="mobile-width-100" style="margin: 0 auto; max-width: 600px;">
          <tr>
            <td class="mobile-padding" style="padding: 0;">
              <!-- Content area with light background -->
              <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 8px;" class="mobile-padding">
                ${content}
              </div>
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