import type { Field } from 'payload'

/**
 * Creates a UI field that displays scheduling controls for broadcasts
 * Shows Schedule button for drafts, Cancel button for scheduled broadcasts
 */
export const createBroadcastScheduleField = (): Field => {
  return {
    name: 'scheduleControls',
    type: 'ui',
    label: 'Scheduling',
    admin: {
      components: {
        Field: 'payload-plugin-newsletter/components#BroadcastScheduleField',
      },
    },
  }
}
