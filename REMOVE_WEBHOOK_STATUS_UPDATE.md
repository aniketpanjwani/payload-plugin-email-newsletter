# Task: Remove Webhook Status Updates from Newsletter Plugin

## Problem
The Broadcast webhook handler is attempting to update newsletter settings with monitoring fields, causing "Only administrators can modify newsletter settings" errors. These status fields are not essential and should be removed.

## Solution
Remove the webhook status update code from the Broadcast webhook handler.

## Files to Modify

### 1. `src/endpoints/webhooks/broadcast.ts`

**Current code (lines ~85-95):**
```javascript
// Update last webhook received timestamp
await req.payload.updateGlobal({
  slug: config.settingsSlug || 'newsletter-settings',
  data: {
    broadcastSettings: {
      ...(settings?.broadcastSettings || {}),
      lastWebhookReceived: new Date().toISOString(),
      webhookStatus: 'verified',
    },
  },
})
```

**Action:** Delete this entire block. The webhook should process events and return success without updating settings.

## Implementation Steps

1. Open `src/endpoints/webhooks/broadcast.ts`
2. Find the `updateGlobal` call (around line 86)
3. Delete the entire update block (lines 85-95)
4. Ensure the function still returns the success response

## Result
The webhook handler will:
- Still verify signatures
- Still process events correctly  
- Still log events for debugging
- No longer attempt to update settings (avoiding permission errors)

## Testing
After making changes:
- Run the test suite
- Verify webhooks still process subscriber events
- Confirm no permission errors in logs