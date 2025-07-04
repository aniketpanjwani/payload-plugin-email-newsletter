/**
 * Email HTML validation utilities
 */

export interface ValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  stats: {
    sizeInBytes: number
    imageCount: number
    linkCount: number
    hasExternalStyles: boolean
    hasJavaScript: boolean
  }
}

/**
 * Validate HTML for email compatibility
 */
export function validateEmailHtml(html: string): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  
  // Calculate size
  const sizeInBytes = new Blob([html]).size
  
  // Check size limits
  if (sizeInBytes > 102400) { // 100KB
    warnings.push(`Email size (${Math.round(sizeInBytes / 1024)}KB) exceeds Gmail's 102KB limit - email may be clipped`)
  }
  
  // Check for problematic CSS
  if (html.includes('position:') && (html.includes('position: absolute') || html.includes('position: fixed'))) {
    errors.push('Absolute/fixed positioning is not supported in most email clients')
  }
  
  if (html.includes('display: flex') || html.includes('display: grid')) {
    errors.push('Flexbox and Grid layouts are not supported in many email clients')
  }
  
  if (html.includes('@media')) {
    warnings.push('Media queries may not work in all email clients')
  }
  
  // Check for JavaScript
  const hasJavaScript = 
    html.includes('<script') || 
    html.includes('onclick') || 
    html.includes('onload') ||
    html.includes('javascript:')
  
  if (hasJavaScript) {
    errors.push('JavaScript is not supported in email and will be stripped by email clients')
  }
  
  // Check for external styles
  const hasExternalStyles = html.includes('<link') && html.includes('stylesheet')
  if (hasExternalStyles) {
    errors.push('External stylesheets are not supported - use inline styles only')
  }
  
  // Check for forms
  if (html.includes('<form') || html.includes('<input') || html.includes('<button')) {
    errors.push('Forms and form elements are not reliably supported in email')
  }
  
  // Check for unsupported tags
  const unsupportedTags = [
    'video', 'audio', 'iframe', 'embed', 'object', 'canvas', 'svg'
  ]
  
  for (const tag of unsupportedTags) {
    if (html.includes(`<${tag}`)) {
      errors.push(`<${tag}> tags are not supported in email`)
    }
  }
  
  // Count images and links
  const imageCount = (html.match(/<img/g) || []).length
  const linkCount = (html.match(/<a/g) || []).length
  
  // Check image usage
  if (imageCount > 20) {
    warnings.push(`High number of images (${imageCount}) may affect email performance`)
  }
  
  // Check for missing alt text
  const imagesWithoutAlt = (html.match(/<img(?![^>]*\balt\s*=)[^>]*>/g) || []).length
  if (imagesWithoutAlt > 0) {
    warnings.push(`${imagesWithoutAlt} image(s) missing alt text - important for accessibility`)
  }
  
  // Check for proper link attributes
  const linksWithoutTarget = (html.match(/<a(?![^>]*\btarget\s*=)[^>]*>/g) || []).length
  if (linksWithoutTarget > 0) {
    warnings.push(`${linksWithoutTarget} link(s) missing target="_blank" attribute`)
  }
  
  // Check for CSS property usage
  if (html.includes('margin: auto') || html.includes('margin:auto')) {
    warnings.push('margin: auto is not supported in Outlook - use align="center" or tables for centering')
  }
  
  if (html.includes('background-image')) {
    warnings.push('Background images are not reliably supported - consider using <img> tags instead')
  }
  
  // Check for rem/em units
  if (html.match(/\d+\s*(rem|em)/)) {
    warnings.push('rem/em units may render inconsistently - use px for reliable sizing')
  }
  
  // Check for negative margins
  if (html.match(/margin[^:]*:\s*-\d+/)) {
    errors.push('Negative margins are not supported in many email clients')
  }
  
  // Validate personalization tags
  const personalizationTags = html.match(/\{\{([^}]+)\}\}/g) || []
  const validTags = ['subscriber.name', 'subscriber.email', 'subscriber.firstName', 'subscriber.lastName']
  
  for (const tag of personalizationTags) {
    const tagContent = tag.replace(/[{}]/g, '').trim()
    if (!validTags.includes(tagContent)) {
      warnings.push(`Unknown personalization tag: ${tag}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    warnings,
    errors,
    stats: {
      sizeInBytes,
      imageCount,
      linkCount,
      hasExternalStyles,
      hasJavaScript,
    }
  }
}

/**
 * Get email client compatibility warnings for specific HTML
 */
export function getClientCompatibilityWarnings(html: string): Record<string, string[]> {
  const warnings: Record<string, string[]> = {
    gmail: [],
    outlook: [],
    appleMail: [],
    mobile: [],
  }
  
  // Gmail specific
  if (html.includes('<style')) {
    warnings.gmail.push('Gmail may strip <style> tags in some contexts')
  }
  
  // Outlook specific
  if (html.includes('margin: auto') || html.includes('margin:auto')) {
    warnings.outlook.push('Outlook does not support margin: auto')
  }
  
  if (html.includes('padding') && html.includes('<p')) {
    warnings.outlook.push('Outlook may not respect padding on <p> tags')
  }
  
  if (html.includes('background-image')) {
    warnings.outlook.push('Outlook has limited background image support')
  }
  
  // Mobile specific
  const hasSmallText = html.match(/font-size:\s*(\d+)px/g)?.some(match => {
    const size = parseInt(match.match(/\d+/)?.[0] || '16')
    return size < 14
  })
  
  if (hasSmallText) {
    warnings.mobile.push('Text smaller than 14px may be hard to read on mobile')
  }
  
  const hasSmallLinks = html.match(/<a[^>]*>[^<]{1,3}<\/a>/g)
  if (hasSmallLinks) {
    warnings.mobile.push('Short link text may be hard to tap on mobile devices')
  }
  
  return warnings
}

/**
 * Suggest fixes for common email HTML issues
 */
export function suggestFixes(html: string): string[] {
  const suggestions: string[] = []
  
  if (html.includes('display: flex')) {
    suggestions.push('Replace flexbox with table-based layouts for better email client support')
  }
  
  if (html.includes('position: absolute')) {
    suggestions.push('Use table cells or margins instead of absolute positioning')
  }
  
  if (html.match(/\d+rem/) || html.match(/\d+em/)) {
    suggestions.push('Convert rem/em units to px for consistent rendering')
  }
  
  if (!html.includes('<!DOCTYPE')) {
    suggestions.push('Add <!DOCTYPE html> declaration for better rendering')
  }
  
  if (!html.includes('charset')) {
    suggestions.push('Add <meta charset="UTF-8"> for proper character encoding')
  }
  
  return suggestions
}