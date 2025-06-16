import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup/unit.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/__tests__/integration/**', 'src/__tests__/security/**', 'e2e/**', 'node_modules/**', 'dist/**'],
    environmentOptions: {
      happyDOM: {
        settings: {
          disableJavaScriptEvaluation: true, // Disable script execution for security
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})