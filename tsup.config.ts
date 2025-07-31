import { defineConfig } from 'tsup'

export default defineConfig([
  // Server build - no React components
  {
    entry: ['src/server.ts'],
    format: ['esm'],
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    dts: true,
    external: ['payload', 'react', 'react-dom'],
    clean: true,
    minify: false,
    target: 'es2020',
    esbuildOptions(options) {
      options.platform = 'node'
      options.mainFields = ['module', 'main']
    },
  },
  // Client build - React components with "use client"
  {
    entry: ['src/client.ts'],
    format: ['esm'],
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    dts: true,
    external: ['payload', 'react', 'react-dom'],
    minify: false,
    target: 'es2020',
    esbuildOptions(options) {
      options.jsx = 'automatic'
      options.platform = 'browser'
      options.mainFields = ['module', 'main']
    },
    banner: {
      js: '"use client";',
    },
  },
  // Admin build - Payload admin components with "use client"
  {
    entry: ['src/admin.ts'],
    format: ['esm'],
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    dts: true,
    external: [
      'payload',
      'react',
      'react-dom',
      '@payloadcms/ui',
      '@payloadcms/richtext-lexical',
      '@payloadcms/translations',
    ],
    minify: false,
    target: 'es2020',
    esbuildOptions(options) {
      options.jsx = 'automatic'
      options.platform = 'browser'
      options.mainFields = ['module', 'main']
    },
    banner: {
      js: '"use client";',
    },
  },
  // Legacy builds for other exports
  {
    entry: {
      types: 'src/exports/types.ts',
      utils: 'src/exports/utils.ts',
      fields: 'src/exports/fields.ts',
      collections: 'src/exports/collections.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: false,
    sourcemap: true,
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
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.js',
      }
    },
  },
])