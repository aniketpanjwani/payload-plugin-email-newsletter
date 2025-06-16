import type { CollectionBeforeChangeHook, CollectionAfterChangeHook } from 'payload'

// Helper to create mock hook arguments with required fields
export const createMockHookArgs = (args: any): any => {
  return {
    collection: {
      slug: 'subscribers',
      config: {} as any,
    },
    context: {
      req: args.req || {},
      res: {} as any,
    },
    ...args,
  }
}

// Helper to create before change hook args
export const createBeforeChangeArgs = (args: {
  data: any
  req: any
  operation: 'create' | 'update'
  originalDoc?: any
}): Parameters<CollectionBeforeChangeHook>[0] => {
  return createMockHookArgs(args)
}

// Helper to create after change hook args
export const createAfterChangeArgs = (args: {
  doc: any
  req: any
  operation: 'create' | 'update'
  previousDoc?: any
}): Parameters<CollectionAfterChangeHook>[0] => {
  return createMockHookArgs(args)
}