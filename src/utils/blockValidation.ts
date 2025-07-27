import type { Block } from 'payload'

/**
 * Email-incompatible block types that should be warned about
 */
const EMAIL_INCOMPATIBLE_TYPES = [
  'chart',
  'dataTable', 
  'interactive',
  'streamable',
  'video',
  'iframe',
  'form',
  'carousel',
  'tabs',
  'accordion',
  'map'
]

/**
 * Validates that blocks are email-compatible and warns about potential issues
 */
export const validateEmailBlocks = (blocks: Block[]): void => {
  blocks.forEach(block => {
    if (EMAIL_INCOMPATIBLE_TYPES.includes(block.slug)) {
      console.warn(`⚠️  Block "${block.slug}" may not be email-compatible. Consider creating an email-specific version.`)
    }
    
    // Check for complex field types that might not work in emails
    const hasComplexFields = block.fields?.some(field => {
      const complexTypes = ['code', 'json', 'richText', 'blocks', 'array']
      return complexTypes.includes(field.type)
    })
    
    if (hasComplexFields) {
      console.warn(`⚠️  Block "${block.slug}" contains complex field types that may not render consistently in email clients.`)
    }
  })
}

/**
 * Creates email-safe block configurations by filtering and validating blocks
 */
export const createEmailSafeBlocks = (customBlocks: Block[] = []): Block[] => {
  // Validate blocks
  validateEmailBlocks(customBlocks)
  
  // Base email-safe blocks that come with the plugin
  const baseBlocks: Block[] = [
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
  ]
  
  // Combine base blocks with custom blocks
  return [
    ...baseBlocks,
    ...customBlocks
  ]
}