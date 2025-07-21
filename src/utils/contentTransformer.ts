import type { SerializedEditorState } from 'lexical'
import { convertToEmailSafeHtml } from './emailSafeHtml'

interface TransformOptions {
  mediaUrl?: string
}

export async function transformContentForPreview(
  lexicalState: SerializedEditorState,
  options: TransformOptions = {}
): Promise<string> {
  // Convert Lexical to HTML with media support
  const html = await convertToEmailSafeHtml(lexicalState, {
    mediaUrl: options.mediaUrl,
  })
  
  // Process custom blocks for email compatibility
  const processedHtml = processCustomBlocks(html)
  
  return processedHtml
}

function processCustomBlocks(html: string): string {
  // Custom block processing is already handled in convertToEmailSafeHtml
  // This function is here for any additional processing needed
  return html
}