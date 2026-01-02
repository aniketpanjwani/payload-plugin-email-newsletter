import type { Payload } from 'payload'
import type { NewsletterPluginConfig } from '../types'

/**
 * Recursively populates media fields in Lexical content.
 * Resolves Media IDs to full media objects with URLs.
 *
 * @param content - Lexical editor state content
 * @param payload - Payload instance for database queries
 * @param config - Newsletter plugin configuration
 * @returns Populated content with resolved media objects
 */
export async function populateMediaFields(
  content: unknown,
  payload: Payload,
  config: NewsletterPluginConfig
): Promise<unknown> {
  if (!content || typeof content !== 'object') return content

  const typedContent = content as { root?: { children?: unknown[] } }

  // Handle Lexical editor state
  if (typedContent.root?.children) {
    for (const child of typedContent.root.children) {
      await populateBlockMediaFields(child, payload, config)
    }
  }

  return content
}

/**
 * Populates media fields in individual block nodes.
 * Handles upload fields, arrays of uploads, and rich text fields.
 */
async function populateBlockMediaFields(
  node: unknown,
  payload: Payload,
  config: NewsletterPluginConfig
): Promise<void> {
  if (!node || typeof node !== 'object') return

  const typedNode = node as {
    type?: string
    fields?: Record<string, unknown>
    children?: unknown[]
  }

  // Check if this is a block node
  if (typedNode.type === 'block' && typedNode.fields) {
    const blockType = (typedNode.fields.blockType || typedNode.fields.blockName) as string | undefined

    // Get custom blocks configuration
    const customBlocks = config.customizations?.broadcasts?.customBlocks || []
    const blockConfig = customBlocks.find((b: { slug: string }) => b.slug === blockType)

    if (blockConfig && blockConfig.fields) {
      // Find all upload fields in the block
      for (const field of blockConfig.fields) {
        if (field.type === 'upload' && field.relationTo && typedNode.fields[field.name]) {
          const fieldValue = typedNode.fields[field.name]
          const collectionName = Array.isArray(field.relationTo) ? field.relationTo[0] : field.relationTo

          // If it's just an ID string, populate it
          if (typeof fieldValue === 'string' && fieldValue.match(/^[a-f0-9]{24}$/i)) {
            try {
              const media = await payload.findByID({
                collection: collectionName,
                id: fieldValue,
                depth: 0,
              })

              if (media) {
                typedNode.fields[field.name] = media
                payload.logger?.info(
                  {
                    mediaId: fieldValue,
                    mediaUrl: (media as { url?: string }).url,
                    filename: (media as { filename?: string }).filename,
                  },
                  `Populated ${field.name} for block ${blockType}`
                )
              }
            } catch (error) {
              payload.logger?.error(
                { error: String(error) },
                `Failed to populate ${field.name} for block ${blockType}`
              )
            }
          }
        }

        // Also handle arrays of uploads
        if (field.type === 'array' && field.fields) {
          const arrayValue = typedNode.fields[field.name]
          if (Array.isArray(arrayValue)) {
            for (const arrayItem of arrayValue) {
              if (arrayItem && typeof arrayItem === 'object') {
                const typedArrayItem = arrayItem as Record<string, unknown>
                // Recursively process array items for upload fields
                for (const arrayField of field.fields) {
                  if (
                    arrayField.type === 'upload' &&
                    arrayField.relationTo &&
                    typedArrayItem[arrayField.name]
                  ) {
                    const arrayFieldValue = typedArrayItem[arrayField.name]
                    const arrayCollectionName = Array.isArray(arrayField.relationTo)
                      ? arrayField.relationTo[0]
                      : arrayField.relationTo

                    if (
                      typeof arrayFieldValue === 'string' &&
                      arrayFieldValue.match(/^[a-f0-9]{24}$/i)
                    ) {
                      try {
                        const media = await payload.findByID({
                          collection: arrayCollectionName,
                          id: arrayFieldValue,
                          depth: 0,
                        })

                        if (media) {
                          typedArrayItem[arrayField.name] = media
                          payload.logger?.info(
                            {
                              mediaId: arrayFieldValue,
                              mediaUrl: (media as { url?: string }).url,
                              filename: (media as { filename?: string }).filename,
                            },
                            `Populated array ${arrayField.name} for block ${blockType}`
                          )
                        }
                      } catch (error) {
                        payload.logger?.error(
                          { error: String(error) },
                          `Failed to populate array ${arrayField.name} for block ${blockType}`
                        )
                      }
                    }
                  }
                }
              }
            }
          }
        }

        // Also handle rich text fields
        if (field.type === 'richText' && typedNode.fields[field.name]) {
          await populateRichTextUploads(typedNode.fields[field.name], payload)
          payload.logger?.info(`Processed rich text field ${field.name} for upload nodes`)
        }
      }
    }
  }

  // Recursively process children
  if (typedNode.children) {
    for (const child of typedNode.children) {
      await populateBlockMediaFields(child, payload, config)
    }
  }
}

/**
 * Populates upload nodes within rich text content.
 * Resolves media IDs to full media objects.
 */
async function populateRichTextUploads(content: unknown, payload: Payload): Promise<void> {
  if (!content || typeof content !== 'object') return

  const typedContent = content as {
    root?: { children?: unknown[] }
  }

  // Handle Lexical root structure
  if (typedContent.root?.children) {
    await processNodeArray(typedContent.root.children)
  }

  // Handle direct children array
  if (Array.isArray(content)) {
    await processNodeArray(content)
  }

  async function processNodeArray(nodes: unknown[]): Promise<void> {
    await Promise.all(nodes.map(processNode))
  }

  async function processNode(node: unknown): Promise<void> {
    if (!node || typeof node !== 'object') return

    const typedNode = node as {
      type?: string
      relationTo?: string
      value?: unknown
      children?: unknown[]
      root?: { children?: unknown[] }
    }

    // Check if this is an upload node with unpopulated value
    if (
      typedNode.type === 'upload' &&
      typedNode.relationTo === 'media' &&
      typeof typedNode.value === 'string' &&
      typedNode.value.match(/^[a-f0-9]{24}$/i)
    ) {
      try {
        const media = await payload.findByID({
          collection: 'media',
          id: typedNode.value,
          depth: 0,
        })

        if (media) {
          typedNode.value = media
          payload.logger?.info(
            {
              mediaId: typedNode.value,
              mediaUrl: (media as { url?: string }).url,
              filename: (media as { filename?: string }).filename,
            },
            'Populated rich text upload node'
          )
        }
      } catch (error) {
        payload.logger?.error(
          { error: String(error) },
          `Failed to populate rich text upload ${typedNode.value}`
        )
      }
    }

    // Recursively process children
    if (typedNode.children && Array.isArray(typedNode.children)) {
      await processNodeArray(typedNode.children)
    }

    // Also check for root property (some Lexical structures)
    if (typedNode.root?.children && Array.isArray(typedNode.root.children)) {
      await processNodeArray(typedNode.root.children)
    }
  }
}
