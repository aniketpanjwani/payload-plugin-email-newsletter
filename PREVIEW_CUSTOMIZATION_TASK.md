# Email Preview Customization Task

## Overview
The email preview in the plugin currently wraps all content in a default email template, which conflicts with custom email templates that users might implement. We need to make the preview customizable so users can control how their emails are rendered in the preview.

## Problem
- The plugin's `EmailPreview.tsx` always wraps content with `wrapInTemplate: true` (line 54)
- This causes styling differences between the preview and what's actually sent to email providers
- Users who implement custom email templates see inconsistent previews

## Required Changes

### 1. Update Type Definitions (`src/types/index.ts`)

Add email preview customization options to the `BroadcastCustomizations` interface:

```typescript
export interface BroadcastCustomizations {
  // ... existing fields ...
  
  /**
   * Email preview customization options
   */
  emailPreview?: {
    /**
     * Whether to wrap preview content in default email template
     * @default true
     */
    wrapInTemplate?: boolean
    
    /**
     * Custom wrapper function for preview content
     * Receives the converted HTML and should return wrapped HTML
     */
    customWrapper?: (content: string, options?: {
      subject?: string
      preheader?: string
    }) => string | Promise<string>
    
    /**
     * Custom preview component to replace the default one entirely
     * If provided, this component will be used instead of the default EmailPreview
     */
    customPreviewComponent?: string // Path to custom component for import map
  }
}
```

### 2. Update Email Preview Component (`src/components/Broadcasts/EmailPreview.tsx`)

Modify the component to use the customization options:

1. Import the plugin config (you'll need to pass it through props or context)
2. Update the `convertContent` function (around line 42) to respect customization options:

```typescript
// Around line 51-54, replace:
const emailHtml = await convertToEmailSafeHtml(content, {
  wrapInTemplate: true,
  preheader,
})

// With:
const emailHtml = await convertToEmailSafeHtml(content, {
  wrapInTemplate: pluginConfig?.customizations?.broadcasts?.emailPreview?.wrapInTemplate ?? true,
  preheader,
  customWrapper: pluginConfig?.customizations?.broadcasts?.emailPreview?.customWrapper,
})
```

### 3. Update Email Safe HTML Utility (`src/utils/emailSafeHtml.ts`)

Modify the `convertToEmailSafeHtml` function to support custom wrapper:

1. Add `customWrapper` to the options interface (around line 36):
```typescript
options?: {
  wrapInTemplate?: boolean
  preheader?: string
  mediaUrl?: string
  customBlockConverter?: (node: any, mediaUrl?: string) => Promise<string>
  payload?: any
  populateFields?: string[] | ((blockType: string) => string[])
  customWrapper?: (content: string, options?: { preheader?: string }) => string | Promise<string>
}
```

2. Update the wrapping logic (around line 54-57):
```typescript
// Optionally wrap in email template
if (options?.wrapInTemplate) {
  if (options.customWrapper) {
    return await Promise.resolve(options.customWrapper(sanitizedHtml, { preheader: options.preheader }))
  }
  return wrapInEmailTemplate(sanitizedHtml, options.preheader)
}
```

### 4. Update Email Preview Field (`src/components/Broadcasts/EmailPreviewField.tsx`)

Pass the plugin config to the EmailPreview component. You'll need to:

1. Import and use a context or prop to get the plugin config
2. Pass it to the EmailPreview component (around line 158):

```typescript
<EmailPreview
  content={fields.content?.value as SerializedEditorState || null}
  subject={fields.subject?.value as string || 'Email Subject'}
  preheader={fields.preheader?.value as string}
  mode={previewMode}
  onValidation={handleValidation}
  pluginConfig={pluginConfig} // Add this
/>
```

### 5. Create Plugin Config Context (`src/contexts/PluginConfigContext.tsx`) - NEW FILE

Create a context to pass plugin config throughout the component tree:

```typescript
import React, { createContext, useContext } from 'react'
import type { NewsletterPluginConfig } from '../types'

const PluginConfigContext = createContext<NewsletterPluginConfig | null>(null)

export const PluginConfigProvider: React.FC<{
  config: NewsletterPluginConfig
  children: React.ReactNode
}> = ({ config, children }) => {
  return (
    <PluginConfigContext.Provider value={config}>
      {children}
    </PluginConfigContext.Provider>
  )
}

export const usePluginConfig = () => {
  const config = useContext(PluginConfigContext)
  if (!config) {
    throw new Error('usePluginConfig must be used within PluginConfigProvider')
  }
  return config
}
```

### 6. Update Broadcasts Collection (`src/collections/Broadcasts.ts`)

Wrap the admin UI components with the PluginConfigProvider. This is more complex and might require modifying how components are initialized.

## Testing Instructions

1. Create a test configuration that uses custom email preview:
```typescript
newsletterPlugin({
  customizations: {
    broadcasts: {
      emailPreview: {
        wrapInTemplate: false,
        // Or with custom wrapper:
        customWrapper: async (content, { preheader }) => {
          return `<div class="my-custom-wrapper">${content}</div>`
        }
      }
    }
  }
})
```

2. Verify that:
   - Default behavior (with template) still works when no customization is provided
   - Setting `wrapInTemplate: false` shows raw content without wrapper
   - Custom wrapper function is called and applied correctly
   - Preview matches what's sent to email providers

## Backward Compatibility

- Default behavior must remain unchanged (wrap in template)
- All customization options should be optional
- Existing installations should work without any configuration changes

## Additional Considerations

1. **Custom Preview Component**: The `customPreviewComponent` option would allow complete replacement of the preview component, but this is a more complex feature that could be added later.

2. **Preview Context**: Consider passing additional context to the custom wrapper like:
   - Current user
   - Broadcast metadata
   - Provider configuration

3. **Documentation**: Update the plugin README with examples of how to use these new customization options.

## Implementation Order

1. Start with type definitions
2. Update emailSafeHtml utility  
3. Modify EmailPreview component
4. Test with various configurations
5. Add documentation

This approach provides maximum flexibility while maintaining backward compatibility and clean architecture.