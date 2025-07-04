import { 
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
  HeadingFeature,
  ParagraphFeature,
  AlignFeature,
  BlockquoteFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { RichTextField } from 'payload'

/**
 * Email-safe features for Lexical editor
 * Only includes features that render consistently across email clients
 */
export const emailSafeFeatures: any[] = [
  // Basic text formatting
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  StrikethroughFeature(),
  
  // Links with simple configuration
  LinkFeature({
    fields: [{
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'Enter the full URL (including https://)',
      },
    }],
  }),
  
  // Lists
  OrderedListFeature(),
  UnorderedListFeature(),
  
  // Headings - limited to h1, h2, h3 for email compatibility
  HeadingFeature({
    enabledHeadingSizes: ['h1', 'h2', 'h3'],
  }),
  
  // Basic paragraph and alignment
  ParagraphFeature(),
  AlignFeature(),
  
  // Blockquotes
  BlockquoteFeature(),
]

/**
 * Creates an email-safe rich text field configuration
 */
export const createEmailContentField = (overrides?: Partial<RichTextField>): RichTextField => {
  return {
    name: 'content',
    type: 'richText',
    required: true,
    editor: lexicalEditor({
      features: emailSafeFeatures,
    }),
    admin: {
      description: 'Email content with limited formatting for compatibility',
      ...overrides?.admin,
    },
    ...overrides,
  }
}