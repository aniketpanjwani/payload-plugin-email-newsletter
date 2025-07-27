# Extension Points & Customization

This guide covers how to extend and customize the Newsletter Plugin to meet your specific needs.

## Broadcasts Collection Customization

You can extend the Broadcasts collection with additional fields and custom blocks while maintaining backward compatibility.

### Adding Custom Fields

Add additional fields to the Broadcasts collection after the subject field:

```typescript
import { newsletterPlugin } from 'payload-plugin-newsletter'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      // ... existing config
      customizations: {
        broadcasts: {
          additionalFields: [
            {
              name: 'slug',
              type: 'text',
              required: true,
              admin: {
                position: 'sidebar',
                description: 'URL-friendly identifier for this broadcast'
              }
            },
            {
              name: 'category',
              type: 'select',
              options: [
                { label: 'Newsletter', value: 'newsletter' },
                { label: 'Announcement', value: 'announcement' },
                { label: 'Product Update', value: 'product-update' }
              ],
              admin: {
                position: 'sidebar'
              }
            }
          ]
        }
      }
    })
  ]
})
```

### Adding Custom Blocks

Extend the email content editor with custom blocks:

```typescript
import type { Block } from 'payload'

const productSpotlightBlock: Block = {
  slug: 'product-spotlight',
  labels: {
    singular: 'Product Spotlight',
    plural: 'Product Spotlights'
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true
    },
    {
      name: 'highlightFeatures',
      type: 'array',
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true
        }
      ]
    },
    {
      name: 'callToAction',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'text',
          defaultValue: 'Learn More'
        },
        {
          name: 'url',
          type: 'text',
          required: true
        }
      ]
    }
  ]
}

export default buildConfig({
  plugins: [
    newsletterPlugin({
      // ... existing config
      customizations: {
        broadcasts: {
          customBlocks: [productSpotlightBlock]
        }
      }
    })
  ]
})
```

### Overriding Default Fields

You can override the default content field or other fields:

```typescript
export default buildConfig({
  plugins: [
    newsletterPlugin({
      // ... existing config
      customizations: {
        broadcasts: {
          fieldOverrides: {
            content: (defaultField) => ({
              ...defaultField,
              admin: {
                ...defaultField.admin,
                description: 'Custom description for email content',
                components: {
                  Field: 'path/to/CustomContentField'
                }
              }
            })
          }
        }
      }
    })
  ]
})
```

## Accessing Plugin Components and Utilities

### Using Field Configurations

Import field configurations for use in your own collections:

```typescript
import { createEmailContentField } from 'payload-plugin-newsletter/fields'
import type { Block } from 'payload'

const customBlock: Block = {
  slug: 'custom-content',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true
    }
  ]
}

export const MyCustomCollection = {
  slug: 'custom-emails',
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true
    },
    // Use the email-safe content field with custom blocks
    createEmailContentField({
      name: 'emailContent',
      additionalBlocks: [customBlock],
      admin: {
        description: 'Email content for custom collection'
      }
    })
  ]
}
```

### Using Collection Factories

Import collection factories to create modified versions:

```typescript
import { createBroadcastsCollection } from 'payload-plugin-newsletter/collections'
import type { NewsletterPluginConfig } from 'payload-plugin-newsletter/types'

// Create a custom broadcasts collection with modifications
const customConfig: NewsletterPluginConfig = {
  // ... your config
  customizations: {
    broadcasts: {
      additionalFields: [
        // ... your custom fields
      ]
    }
  }
}

export const CustomBroadcastsCollection = createBroadcastsCollection(customConfig)
```

## Custom Email Blocks

### Creating Email-Safe Blocks

When creating custom blocks for email content, ensure they render consistently across email clients:

```typescript
import type { Block } from 'payload'

export const testimonialBlock: Block = {
  slug: 'testimonial',
  labels: {
    singular: 'Testimonial',
    plural: 'Testimonials'
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The testimonial quote'
      }
    },
    {
      name: 'author',
      type: 'group',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true
        },
        {
          name: 'title',
          type: 'text'
        },
        {
          name: 'company',
          type: 'text'
        },
        {
          name: 'avatar',
          type: 'upload',
          relationTo: 'media'
        }
      ]
    },
    {
      name: 'style',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Highlighted', value: 'highlighted' },
        { label: 'Minimal', value: 'minimal' }
      ]
    }
  ],
  // Add interface name for TypeScript
  interfaceName: 'TestimonialBlock'
}
```

### Email-Safe Styling Guidelines

When creating custom blocks, follow these guidelines for email compatibility:

1. **Use inline styles** - External CSS may not be supported
2. **Avoid advanced CSS** - Stick to basic properties like `color`, `background-color`, `padding`, `margin`
3. **Use tables for layout** - Many email clients don't support modern CSS layout
4. **Test across clients** - Use tools like Litmus or Email on Acid to test rendering

## Advanced Customization

### Complete Field Override

For maximum control, you can override the entire field configuration:

```typescript
import { createEmailSafeFeatures } from 'payload-plugin-newsletter/fields'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

const customBlocks = [
  // ... your custom blocks
]

export default buildConfig({
  plugins: [
    newsletterPlugin({
      // ... existing config
      customizations: {
        broadcasts: {
          fieldOverrides: {
            content: () => ({
              name: 'content',
              type: 'richText',
              required: true,
              editor: lexicalEditor({
                features: createEmailSafeFeatures(customBlocks)
              }),
              admin: {
                description: 'Completely custom email content field'
              }
            })
          }
        }
      }
    })
  ]
})
```

### TypeScript Support

The plugin provides full TypeScript support for customizations:

```typescript
import type { BroadcastCustomizations, Block } from 'payload-plugin-newsletter/types'

const customizations: BroadcastCustomizations = {
  additionalFields: [
    // Fully typed field definitions
  ],
  customBlocks: [
    // Fully typed block definitions
  ],
  fieldOverrides: {
    content: (defaultField) => ({
      // Fully typed field override
      ...defaultField,
      // Your modifications
    })
  }
}
```

## Migration and Backward Compatibility

### Updating Existing Installations

The customization system maintains full backward compatibility. Existing installations will continue to work without any changes.

### Gradual Migration

You can gradually migrate existing customizations:

1. **Start small** - Add one custom field or block at a time
2. **Test thoroughly** - Ensure email rendering works across clients
3. **Document changes** - Keep track of customizations for team members

### Version Compatibility

- Customizations are available in v0.15.0+
- All customization interfaces are marked as stable
- Breaking changes will follow semantic versioning

## Best Practices

1. **Keep email-safe** - Always test custom blocks in multiple email clients
2. **Use semantic names** - Choose clear, descriptive names for custom fields and blocks
3. **Document customizations** - Maintain documentation for your team
4. **Version control** - Track changes to customizations in your codebase
5. **Test thoroughly** - Test both the admin UI and email rendering

## Examples

Check out these example implementations:

- **E-commerce Newsletter** - Product blocks, promotional banners
- **SaaS Updates** - Feature announcements, changelog blocks
- **Content Marketing** - Author bios, related articles, social proof

For more examples and community contributions, visit our [GitHub repository](https://github.com/aniketpanjwani/payload-plugin-email-newsletter).