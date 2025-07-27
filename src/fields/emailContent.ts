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
  BlocksFeature,
  UploadFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { RichTextField, Block } from 'payload'

/**
 * Creates email-safe features for Lexical editor with optional additional blocks
 * Only includes features that render consistently across email clients
 */
// Using any[] here because Payload's FeatureProviderServer type is complex
// and varies between versions. The features are properly typed by Payload internally.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createEmailSafeFeatures = (additionalBlocks?: Block[]): any[] => {
  // Base email-safe blocks
  const baseBlocks = [
    {
      slug: 'button',
      fields: [
        {
          name: 'text',
          type: 'text',
          label: 'Button Text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'Button URL',
          required: true,
          admin: {
            description: 'Enter the full URL (including https://)',
          },
        },
        {
          name: 'style',
          type: 'select',
          label: 'Button Style',
          defaultValue: 'primary',
          options: [
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Outline', value: 'outline' },
          ],
        },
      ],
      interfaceName: 'EmailButton',
      labels: {
        singular: 'Button',
        plural: 'Buttons',
      },
    },
    {
      slug: 'divider',
      fields: [
        {
          name: 'style',
          type: 'select',
          label: 'Divider Style',
          defaultValue: 'solid',
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Dashed', value: 'dashed' },
            { label: 'Dotted', value: 'dotted' },
          ],
        },
      ],
      interfaceName: 'EmailDivider',
      labels: {
        singular: 'Divider',
        plural: 'Dividers',
      },
    },
  ] as Block[]

  // Merge additional blocks if provided
  const allBlocks = [
    ...baseBlocks,
    ...(additionalBlocks || [])
  ]

  return [
    // Toolbars
    FixedToolbarFeature(), // Fixed toolbar at the top
    InlineToolbarFeature(), // Floating toolbar when text is selected
    
    // Basic text formatting
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    
    // Links with enhanced configuration
    LinkFeature({
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'Enter the full URL (including https://)',
          },
        },
        {
          name: 'newTab',
          type: 'checkbox',
          label: 'Open in new tab',
          defaultValue: false,
        },
      ],
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
    
    // Upload feature for images
    UploadFeature({
      collections: {
        media: {
          fields: [
            {
              name: 'caption',
              type: 'text',
              admin: {
                description: 'Optional caption for the image',
              },
            },
            {
              name: 'altText',
              type: 'text',
              label: 'Alt Text',
              required: true,
              admin: {
                description: 'Alternative text for accessibility and when image cannot be displayed',
              },
            },
          ],
        },
      },
    }),
    
    // Custom blocks for email-specific content
    BlocksFeature({
      blocks: allBlocks,
    }),
  ]
}

/**
 * Legacy export for backward compatibility
 */
export const emailSafeFeatures = createEmailSafeFeatures()

/**
 * Creates an email-safe rich text field configuration
 */
export const createEmailContentField = (
  overrides?: Partial<RichTextField> & {
    additionalBlocks?: Block[]
  }
): RichTextField => {
  // Create features array with blocks
  const features = createEmailSafeFeatures(overrides?.additionalBlocks)

  return {
    name: 'content',
    type: 'richText',
    required: true,
    editor: lexicalEditor({
      features,
    }),
    admin: {
      description: 'Email content with limited formatting for compatibility',
      ...overrides?.admin,
    },
    ...overrides,
  }
}