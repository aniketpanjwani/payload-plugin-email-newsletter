import type { Field } from 'payload'
import type { NewsletterPluginConfig } from '../types'

export function createNewsletterSchedulingFields(
  config: NewsletterPluginConfig
): Field[] {
  const groupName = config.features?.newsletterScheduling?.fields?.groupName || 'newsletterScheduling'
  const contentField = config.features?.newsletterScheduling?.fields?.contentField || 'content'
  const createMarkdownField = config.features?.newsletterScheduling?.fields?.createMarkdownField !== false

  const fields: Field[] = [
    {
      name: groupName,
      type: 'group',
      label: 'Newsletter Scheduling',
      admin: {
        condition: (data, { user }) => user?.collection === 'users', // Only show for admin users
      },
      fields: [
        {
          name: 'scheduled',
          type: 'checkbox',
          label: 'Schedule for Newsletter',
          defaultValue: false,
          admin: {
            description: 'Schedule this content to be sent as a newsletter',
          },
        },
        {
          name: 'scheduledDate',
          type: 'date',
          label: 'Send Date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            condition: (data) => data?.[groupName]?.scheduled,
            description: 'When to send this newsletter',
          },
        },
        {
          name: 'sentDate',
          type: 'date',
          label: 'Sent Date',
          admin: {
            readOnly: true,
            condition: (data) => data?.[groupName]?.sendStatus === 'sent',
            description: 'When this newsletter was sent',
          },
        },
        {
          name: 'sendStatus',
          type: 'select',
          label: 'Status',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Sending', value: 'sending' },
            { label: 'Sent', value: 'sent' },
            { label: 'Failed', value: 'failed' },
          ],
          defaultValue: 'draft',
          admin: {
            readOnly: true,
            description: 'Current send status',
          },
        },
        {
          name: 'emailSubject',
          type: 'text',
          label: 'Email Subject',
          required: true,
          admin: {
            condition: (data) => data?.[groupName]?.scheduled,
            description: 'Subject line for the newsletter email',
          },
        },
        {
          name: 'preheader',
          type: 'text',
          label: 'Email Preheader',
          admin: {
            condition: (data) => data?.[groupName]?.scheduled,
            description: 'Preview text that appears after the subject line',
          },
        },
        {
          name: 'segments',
          type: 'select',
          label: 'Target Segments',
          hasMany: true,
          options: [
            { label: 'All Subscribers', value: 'all' },
            ...(config.i18n?.locales?.map(locale => ({
              label: `${locale.toUpperCase()} Subscribers`,
              value: locale,
            })) || []),
          ],
          defaultValue: ['all'],
          admin: {
            condition: (data) => data?.[groupName]?.scheduled,
            description: 'Which subscriber segments to send to',
          },
        },
        {
          name: 'testEmails',
          type: 'array',
          label: 'Test Email Recipients',
          admin: {
            condition: (data) => data?.[groupName]?.scheduled && data?.[groupName]?.sendStatus === 'draft',
            description: 'Send test emails before scheduling',
          },
          fields: [
            {
              name: 'email',
              type: 'email',
              required: true,
            },
          ],
        },
      ],
    },
  ]

  // Add markdown companion field if requested
  if (createMarkdownField) {
    fields.push(createMarkdownFieldInternal({
      name: `${contentField}Markdown`,
      richTextField: contentField,
      label: 'Email Content (Markdown)',
      admin: {
        position: 'sidebar',
        condition: (data: any) => Boolean(data?.[contentField] && data?.[groupName]?.scheduled),
        description: 'Markdown version for email rendering',
        readOnly: true,
      },
    }))
  }

  return fields
}

/**
 * Create a markdown companion field for rich text
 * This creates a virtual field that converts rich text to markdown
 */
function createMarkdownFieldInternal(config: {
  name: string
  richTextField: string
  label?: string
  admin?: any
}): Field {
  return {
    name: config.name,
    type: 'textarea',
    label: config.label || 'Markdown',
    admin: {
      ...config.admin,
      description: config.admin?.description || 'Auto-generated from rich text content',
    },
    hooks: {
      afterRead: [
        async ({ data }) => {
          // Convert rich text to markdown on read
          if (data?.[config.richTextField]) {
            try {
              const { convertLexicalToMarkdown } = await import('@payloadcms/richtext-lexical')
              return convertLexicalToMarkdown({
                data: data[config.richTextField],
              } as any)
            } catch (error) {
              console.error('Failed to convert rich text to markdown:', error)
              return ''
            }
          }
          return ''
        },
      ],
      beforeChange: [
        () => {
          // Don't save markdown to database
          return null
        },
      ],
    },
  }
}