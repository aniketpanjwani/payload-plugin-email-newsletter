const { readFileSync } = require('fs')
const { join } = require('path')

const FORBIDDEN_IN_ADMIN = [
  'worker_threads',
  'node:assert', 
  'node:fs',
  'pino',
  'pino-abstract-transport',
  '@payloadcms/next/utilities',
  'telemetry'
]

const FORBIDDEN_IN_CLIENT = [
  'worker_threads',
  'node:assert',
  'node:fs',
  'fs',
  'path',
  'crypto',
  'os',
]

function validateBundle(bundlePath, bundleName, forbiddenDeps) {
  try {
    const bundleContent = readFileSync(join('dist', bundlePath), 'utf-8')
    
    for (const forbidden of forbiddenDeps) {
      if (bundleContent.includes(forbidden)) {
        throw new Error(`${bundleName} bundle contains forbidden server dependency: ${forbidden}`)
      }
    }
    
    console.log(`✅ ${bundleName} bundle validation passed`)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`⚠️  ${bundleName} bundle not found: ${bundlePath}`)
      return
    }
    throw error
  }
}

function main() {
  console.log('🔍 Validating bundles for server dependencies...')
  
  // Validate admin bundle (most critical)
  validateBundle('admin.js', 'Admin', FORBIDDEN_IN_ADMIN)
  
  // Validate client bundle
  validateBundle('client.js', 'Client', FORBIDDEN_IN_CLIENT)
  
  // Check that server bundle exists (should contain server deps)
  try {
    readFileSync(join('dist', 'server.js'))
    console.log('✅ Server bundle exists')
  } catch {
    throw new Error('❌ Server bundle missing')
  }
  
  console.log('🎉 All bundle validations passed!')
}

if (require.main === module) {
  main()
}