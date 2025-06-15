# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-06-15

### Added
- Comprehensive security improvements to respect Payload access control
- Synthetic user pattern for subscriber self-service operations
- Admin verification for newsletter settings modifications
- Security documentation in README

### Changed
- All API endpoints now properly implement `overrideAccess` and `user` parameters
- Preferences endpoint now ensures subscribers can only access their own data
- Unsubscribe endpoint validates ownership through tokens
- Magic link verification uses synthetic users for updates
- Newsletter settings modifications now require admin authentication

### Security
- Implemented proper access control for all Payload Local API operations
- Added user context validation for authenticated endpoints
- Restricted settings access to admin users only
- Enhanced protection against unauthorized data access

## [0.2.0] - 2025-06-15

### Changed
- **BREAKING**: Changed newsletter settings from a global to a collection
  - Allows multiple configurations (e.g., dev/staging/prod)
  - Only one configuration can be active at a time
  - Migrate existing settings by creating a new configuration in the collection
- Updated README to clarify the settings collection usage

### Added
- Support for multiple email configurations
- Automatic deactivation of other configs when activating one
- Configuration name field for better organization

## [0.1.1] - 2025-06-15

### Fixed
- Updated README to reflect npm availability
- Fixed package.json warnings for npm publishing

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

[0.3.0]: https://github.com/aniketpanjwani/payload-plugin-email-newsletter/releases/tag/v0.3.0
[0.2.0]: https://github.com/aniketpanjwani/payload-plugin-email-newsletter/releases/tag/v0.2.0
[0.1.1]: https://github.com/aniketpanjwani/payload-plugin-email-newsletter/releases/tag/v0.1.1
[0.1.0]: https://github.com/aniketpanjwani/payload-plugin-email-newsletter/releases/tag/v0.1.0

---

**npm**: https://www.npmjs.com/package/payload-plugin-newsletter