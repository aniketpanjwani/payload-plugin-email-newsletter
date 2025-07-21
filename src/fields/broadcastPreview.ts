import type { Field } from 'payload'

export const createBroadcastPreviewField = (): Field => {
  return {
    name: 'broadcastPreview',
    type: 'ui',
    admin: {
      components: {
        Field: 'payload-plugin-newsletter/components#BroadcastPreviewField',
      },
      position: 'sidebar',
    },
  }
}