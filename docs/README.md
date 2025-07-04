# Payload Newsletter Plugin Documentation

Welcome to the comprehensive documentation for the Payload Newsletter Plugin. This plugin provides complete newsletter management capabilities for Payload CMS projects.

> **⚠️ Payload v3 Users**: Please ensure you're using plugin version 0.8.7 or higher for full compatibility. See the [Payload v3 Migration Guide](./guides/payload-v3-migration.md) for important information.

## Documentation Structure

### 📚 [Getting Started](./getting-started/)
- [Quick Start Guide](./getting-started/quick-start.md)
- [Installation](./getting-started/installation.md)
- [Basic Configuration](./getting-started/configuration.md)
- [First Newsletter](./getting-started/first-newsletter.md)

### 🔧 [API Reference](./api-reference/)
- [Plugin Configuration](./api-reference/plugin-config.md)
- [Collections](./api-reference/collections.md)
- [Endpoints](./api-reference/endpoints.md)
- [Email Utilities](./api-reference/email-utilities.md) - **New in v0.9.0**
- [Hooks](./api-reference/hooks.md)
- [Types](./api-reference/types.md)

### 📖 [Guides](./guides/)
- [Email Providers](./guides/email-providers.md)
- [Email Preview](./guides/email-preview.md) - **New in v0.9.0**
- [Payload v3 Migration](./guides/payload-v3-migration.md) - **Important for v3 users**
- [Authentication](./guides/authentication.md)
- [Subscriber Management](./guides/subscriber-management.md)
- [Sending Newsletters](./guides/sending-newsletters.md)
- [Templates](./guides/templates.md)
- [Security Best Practices](./guides/security.md)

### 🏗️ [Architecture](./architecture/)
- [Plugin Architecture](./architecture/overview.md)
- [Data Flow](./architecture/data-flow.md)
- [Email-Safe HTML](./architecture/email-safe-html.md)
- [Status Synchronization](./architecture/status-synchronization.md)
- [Security Model](./architecture/security-model.md)
- [Extension Points](./architecture/extension-points.md)

### 👨‍💻 [Development](./development/)
- [Contributing](./development/contributing.md)
- [Development Setup](./development/setup.md)
- [Testing](./development/testing.md)
- [Release Process](./development/releases.md)

### 📄 [References](./references/)
- [Broadcast API Documentation](./references/broadcast-api-docs.md) - Complete Broadcast.co API reference
- [Payload CMS Resources](./references/payload-resources.md)
- [Troubleshooting](./references/troubleshooting.md)

## Quick Links

- 🚀 [Quick Start](./getting-started/quick-start.md) - Get up and running in 5 minutes
- 📊 [Examples](./guides/examples.md) - See real-world implementations
- 🔒 [Security Guide](./guides/security.md) - Best practices for secure newsletters
- 🎨 [Component Library](./api-reference/components.md) - Pre-built React components

## Plugin Features

- ✅ Complete subscriber management with double opt-in
- ✅ Magic link authentication for subscribers
- ✅ Multiple email provider support (Resend, Broadcast, custom)
- ✅ React components for signup forms
- ✅ Built-in security (XSS protection, rate limiting, CSRF)
- ✅ Email preview with validation (v0.9.0+)
- ✅ Email-safe rich text editor (v0.9.0+)
- ✅ Internationalization support
- ✅ Comprehensive TypeScript types
- ✅ Extensive test coverage

## Need Help?

- Check the [Troubleshooting Guide](./references/troubleshooting.md)
- Review [Examples](./guides/examples.md)
- Report issues on [GitHub](https://github.com/aniketpanjwani/payload-plugin-email-newsletter/issues)

## License

This plugin is open source and available under the MIT License.