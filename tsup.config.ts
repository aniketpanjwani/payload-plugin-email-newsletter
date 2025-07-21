import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/exports/client.ts',
    types: 'src/exports/types.ts',
    components: 'src/exports/components.ts',
    utils: 'src/exports/utils.ts',
    fields: 'src/exports/fields.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2020',
  external: [
    'payload',
    'react',
    'react-dom',
    '@payloadcms/ui',
    '@payloadcms/next/views',
    '@payloadcms/richtext-lexical',
    '@payloadcms/translations',
    '@react-email/components',
    '@react-email/render',
    'isomorphic-dompurify',
    'jsonwebtoken',
    'resend',
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.platform = 'node'
    options.mainFields = ['module', 'main']
  },
  // Ensure proper extensions for ESM/CJS
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    }
  },
  onSuccess: async () => {
    console.log('Build complete!')
  },
})