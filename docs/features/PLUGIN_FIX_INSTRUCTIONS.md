# Instructions for Fixing useAsTitle Issue in payload-plugin-newsletter

## Problem
The Broadcasts collection in the plugin is using `useAsTitle: 'contentSection.subject'` which references a nested field. Payload CMS v3 doesn't allow `useAsTitle` to reference nested fields, causing the following error during type generation:

```
InvalidConfiguration: "useAsTitle" cannot be a nested field. Please specify a top-level field in the collection "broadcasts"
```

## Solution
Move the `subject` field to the top level of the Broadcasts collection while keeping other fields inside the `contentSection` group to maintain the split-screen layout.

## Steps to Implement

1. **Navigate to the plugin directory**: `/Users/aniketpanjwani/Projects/payload_newsletter_plugin`

2. **Edit the Broadcasts collection**: `src/collections/Broadcasts.ts`

3. **Make these specific changes**:
   
   a. Move the subject field to be a top-level field (before the row):
   ```typescript
   fields: [
     {
       name: 'subject',
       type: 'text',
       required: true,
       admin: {
         description: 'Email subject line'
       },
     },
     {
       type: 'row',
       fields: [
         // ... rest of the fields
   ```

   b. Remove the subject field from inside `contentSection.fields`

   c. Update `useAsTitle` to reference the top-level field:
   ```typescript
   admin: {
     useAsTitle: 'subject',  // Changed from 'contentSection.subject'
     description: 'Individual email campaigns sent to subscribers',
     defaultColumns: ['subject', 'status', 'sentAt', 'recipientCount', 'actions'], // Also update here
   },
   ```

4. **Check for any other references** to `contentSection.subject` in the plugin codebase and update them to just `subject`:
   - Search for: `contentSection.subject`
   - Replace with: `subject`
   - Likely files to check:
     - Any email template files
     - API endpoints that create or update broadcasts
     - Any components that display broadcast data

5. **Update the version** in `package.json` to `0.13.2` since this is a bug fix

6. **Test the changes**:
   - Run type generation in a test project
   - Create a new broadcast to ensure the UI still works
   - Verify the subject line is saved and displayed correctly

## Why This Fix Works
- The subject field becomes a top-level field, satisfying Payload's requirement
- The split-screen layout is preserved because only the subject moves out
- The preheader and content fields remain in the contentSection group
- The preview section remains in its own group on the right side

## Expected Result
After this fix:
- Type generation will work without errors
- The Broadcasts admin UI will still have the split-screen layout
- The subject field will appear above the split sections
- All functionality remains the same

## Important Notes
- This is a breaking change for existing broadcasts data since the field path changes
- Consider adding a migration script if there are existing broadcasts in production
- The fix maintains backward compatibility for the API by updating field references