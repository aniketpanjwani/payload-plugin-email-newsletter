import type { Field } from 'payload'

export const createBroadcastPreviewField = (): Field => {
  return {
    name: 'broadcastPreview',
    type: 'ui',
    admin: {
      components: {
        Field: '/src/components/Broadcasts/BroadcastPreviewField',
      },
      position: 'sidebar',
    },
  }
}