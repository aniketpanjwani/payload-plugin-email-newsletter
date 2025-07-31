import { defineConfig } from 'tsup'

export default defineConfig([
  // Server build - Node.js only
  {
    entry: { server: 'src/server/index.ts' },
    format: ['esm'],
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    dts: true,
    external: ['payload', 'react', 'react-dom'],
    clean: true,
    minify: false,
    target: 'node18',
    platform: 'node',
    esbuildOptions(options) {
      options.platform = 'node'
      options.mainFields = ['module', 'main']
    },
  },
  // Client build - Browser only
  {
    entry: { client: 'src/client/index.ts' },
    format: ['esm'],
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    dts: true,
    external: ['payload', 'react', 'react-dom'],
    minify: false,
    target: 'es2020',
    platform: 'browser',
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    esbuildOptions(options) {
      options.jsx = 'automatic'
      options.platform = 'browser'
      options.mainFields = ['module', 'main']
    },
    banner: {
      js: '"use client";',
    },
  },
  // Admin build - Browser only (STRICT)
  {
    entry: { admin: 'src/admin/index.ts' },
    format: ['esm'],
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    dts: true,
    external: [
      'payload',
      'react', 
      'react-dom',
      // Critical: External all Node.js modules
      'fs', 'path', 'crypto', 'os', 'util', 'assert',
      'worker_threads', 'stream', 'buffer', 'url',
      'querystring', 'node:*',
      // External Payload server utilities
      '@payloadcms/next/utilities',
      'pino', 'pino-pretty', 'pino-abstract-transport'
    ],
    platform: 'browser',
    target: 'es2020',
    noExternal: [], // Nothing should be bundled that's not explicitly allowed
    minify: false,
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