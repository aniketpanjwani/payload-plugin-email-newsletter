# Feedback & Design Decisions

We'd love your feedback on the Payload Newsletter Plugin! This document outlines key design decisions we've made and areas where community input would be especially valuable.

## 🤔 Design Decisions We'd Like Feedback On

### 1. Magic Link Authentication Approach

**Current Design**: We've implemented a custom JWT-based magic link system that's completely separate from Payload's built-in authentication.

**Rationale**: 
- Newsletter subscribers typically don't need full CMS access
- Passwordless is more user-friendly for newsletter management
- Keeps subscriber auth separate from admin auth

**Questions for the Community**:
- Would you prefer an option to integrate with Payload's auth system?
- Is the current token expiration (7 days) appropriate?
- Should we support other passwordless methods (OTP, social login)?

### 2. Email Provider Architecture

**Current Design**: We support Resend and Broadcast with a provider-agnostic interface.

**Questions for the Community**:
- Which other email providers should we prioritize? (SendGrid, Mailgun, AWS SES, Postmark?)
- Should we support multiple providers simultaneously (e.g., failover)?
- Is the current provider interface flexible enough for your needs?

### 3. Newsletter Scheduling Integration

**Current Design**: We inject fields into your existing articles collection rather than creating a separate newsletter collection.

**Rationale**:
- Leverages existing content
- Avoids duplication
- Simpler mental model

**Questions for the Community**:
- Would you prefer a dedicated newsletters collection?
- Should we support scheduling multiple article types (not just articles)?
- What additional scheduling features would be valuable?

### 4. Component Library Approach

**Current Design**: React-only components using Payload's UI library.

**Questions for the Community**:
- Would you like vanilla JS examples for non-React frontends?
- Should we provide more component variants (embedded, modal, etc.)?
- What styling/theming options would be most useful?

### 5. Data Collection & Analytics

**Current Design**: We collect UTM parameters and basic metadata but don't include analytics dashboards.

**Questions for the Community**:
- What analytics would be most valuable to track?
- Should we integrate with analytics platforms (GA, Plausible, etc.)?
- Would you want a built-in analytics dashboard?

### 6. Default Field Schema

**Current Design**: We include a comprehensive set of fields (name, locale, preferences, segments, etc.).

**Questions for the Community**:
- Are there fields we should add or remove by default?
- Should some fields be opt-in rather than default?
- How can we better support custom field requirements?

## 💡 Feature Requests

We're considering these features for future releases:

1. **Double opt-in workflow** - Email confirmation before activation
2. **A/B testing** - Test subject lines and content
3. **Automation workflows** - Welcome series, drip campaigns
4. **Segmentation UI** - Visual segment builder
5. **Template marketplace** - Share email templates
6. **Import/Export tools** - Migrate from other platforms
7. **Webhook support** - Notify external services of events
8. **Email preview** - See how emails look before sending

**What features would you prioritize?**

## 🐛 Known Limitations

Current limitations we're aware of:

1. No built-in unsubscribe page (API only)
2. No email bounce handling
3. No GDPR compliance features (by design, but reconsidering)
4. Limited email template customization
5. No support for attachments

**Which limitations affect you most?**

## 📝 How to Provide Feedback

We welcome all feedback! Here's how to contribute:

1. **GitHub Issues**: For bugs and feature requests
   - [Create an issue](https://github.com/aniketpanjwani/payload-plugin-email-newsletter/issues)

2. **GitHub Discussions**: For design discussions and questions
   - [Start a discussion](https://github.com/aniketpanjwani/payload-plugin-email-newsletter/discussions)

3. **Pull Requests**: For direct contributions
   - Fork the repo and submit a PR
   - Include tests for new features
   - Update documentation as needed

4. **Discord**: For quick questions and community discussion
   - Join the [Payload Discord](https://discord.gg/payload)
   - Find us in #plugins channel

## 🚀 Roadmap Influence

Your feedback directly influences our roadmap. We review all feedback monthly and prioritize based on:

1. Community votes/reactions
2. Implementation complexity
3. Alignment with Payload patterns
4. Benefit to most users

## Example Use Cases

We'd love to hear about your use cases! Some we've considered:

- **SaaS applications**: Product updates and announcements
- **Content sites**: Weekly digests and new post notifications
- **E-commerce**: Order updates and promotional emails
- **Communities**: Event notifications and member updates
- **Educational**: Course updates and learning resources

**What's your use case?**

## Contributing Code

If you'd like to contribute:

1. Check existing issues/discussions first
2. Propose significant changes via discussion before implementing
3. Follow Payload's coding standards
4. Include tests and documentation
5. Keep PRs focused on a single feature/fix

Thank you for helping make this plugin better for everyone! 🙏