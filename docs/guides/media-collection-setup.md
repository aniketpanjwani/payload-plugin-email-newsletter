# Media Collection Setup for Newsletter Plugin

The Newsletter Plugin now supports images in broadcast emails. To use this feature, you need to have a Media collection configured in your Payload CMS.

## Prerequisites

You need a Media collection in your Payload configuration. This is typically already present in most Payload projects.

## Basic Media Collection

If you don't have a Media collection yet, here's a minimal configuration:

```typescript
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined, // Maintains aspect ratio
        position: 'centre',
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
      admin: {
        description: 'Alternative text for accessibility',
      },
    },
  ],
}
```

## Using S3 for Media Storage

For production environments, we recommend using S3 for media storage:

```bash
npm install @payloadcms/storage-s3
```

```typescript
import { buildConfig } from 'payload'
import { s3Storage } from '@payloadcms/storage-s3'
import { Media } from './collections/Media'

export default buildConfig({
  collections: [Media, /* other collections */],
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        region: process.env.S3_REGION,
      },
    }),
    // Newsletter plugin
    newsletterPlugin({
      // your config
    }),
  ],
})
```

## Environment Variables for S3

```bash
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

## Using Images in Broadcasts

Once your Media collection is configured, you can:

1. **Insert Images**: Use the image button in the rich text editor toolbar
2. **Upload New Images**: Upload directly from the editor
3. **Select Existing Images**: Choose from previously uploaded media
4. **Add Captions**: Optional captions for images
5. **Set Alt Text**: Required for accessibility

### Email-Safe Image Rendering

The plugin automatically converts uploaded images to email-safe HTML:

- Images are centered and responsive
- Max-width is set to 100% for mobile compatibility
- Alt text is preserved for accessibility
- Captions are rendered below images in a subtle style

### Image URL Handling

The plugin handles different image URL scenarios:

1. **Local Storage**: Images served from `/api/media/file/[filename]`
2. **S3 with Payload Access**: Images proxied through Payload API
3. **S3 Direct Access**: Direct S3 URLs when `disablePayloadAccessControl: true`

## Best Practices

1. **Image Optimization**: 
   - Use appropriate image sizes (configure in `imageSizes`)
   - Compress images before uploading
   - Use web-friendly formats (JPEG, PNG, WebP)

2. **Email Compatibility**:
   - Keep images under 1MB for email
   - Use standard aspect ratios
   - Always provide alt text

3. **Performance**:
   - Configure CDN for S3 bucket
   - Enable browser caching
   - Use responsive image sizes

## Troubleshooting

### Images Not Displaying in Email Preview

1. Check that the Media collection exists and is accessible
2. Verify image URLs are absolute (not relative)
3. Ensure proper CORS configuration for S3

### Upload Errors

1. Check file size limits in Payload config
2. Verify S3 bucket permissions
3. Ensure mime types are allowed in Media collection

### Missing Alt Text

The editor requires alt text for accessibility. If you see validation errors, ensure all images have alt text set.