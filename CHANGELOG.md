# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-06-15

### Added
- Initial release of Payload Newsletter Plugin
- Subscribers collection with comprehensive field schema
- Email settings global for admin UI configuration
- Magic link authentication system (separate from Payload auth)
- Email service providers: Resend and Broadcast
- Newsletter scheduling for any collection
- Automatic markdown generation from rich text fields
- Customizable email templates using React Email
- React components: NewsletterForm, PreferencesForm, MagicLinkVerify
- useNewsletterAuth hook for client-side state management
- API endpoints for subscription, authentication, and preferences
- Full TypeScript support with comprehensive types
- Internationalization support
- UTM tracking and analytics data collection
- Lead magnet support
- Rate limiting and security features

### Security
- JWT-based authentication for magic links
- Session token management
- Rate limiting by IP address
- Domain restriction options
- Input validation and sanitization

[0.1.0]: https://github.com/aniketpanjwani/payload-plugin-email-newsletter/releases/tag/v0.1.0

---

**npm**: https://www.npmjs.com/package/payload-plugin-newsletter