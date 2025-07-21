import type { Field } from 'payload'

export const createBroadcastInlinePreviewField = (): Field => {
  return {
    name: 'broadcastInlinePreview',
    type: 'ui',
    admin: {
      components: {
        Field: '/src/components/Broadcasts/BroadcastInlinePreview',
      },
    },
  }
}