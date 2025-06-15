# 🎉 Payload Newsletter Plugin v0.1.0 Released!

We're excited to announce the first release of the Payload Newsletter Plugin - a complete newsletter management solution for Payload CMS!

## 📦 Installation

The plugin is now available on npm:

```bash
npm install payload-plugin-newsletter
# or
bun add payload-plugin-newsletter
# or
yarn add payload-plugin-newsletter
```

## ✨ Key Features

- **📧 Complete Subscriber Management** - Ready-to-use subscriber collection with all essential fields
- **🔐 Magic Link Authentication** - Passwordless authentication for subscribers (separate from Payload auth)
- **📨 Email Service Integration** - Built-in support for Resend and Broadcast
- **📅 Newsletter Scheduling** - Schedule newsletters from your articles collection
- **⚛️ React Components** - Pre-built signup forms and preference management UI
- **🌍 Internationalization** - Multi-language support built-in
- **📊 Analytics Ready** - UTM tracking and signup metadata collection

## 🚀 Quick Start

```typescript
import { buildConfig } from 'payload/config'
import { newsletterPlugin } from 'payload-plugin-newsletter'

export default buildConfig({
  plugins: [
    newsletterPlugin({
      providers: {
        default: 'resend',
        resend: {
          apiKey: process.env.RESEND_API_KEY,
          fromAddress: 'hello@yoursite.com',
          fromName: 'Your Newsletter',
        },
      },
    }),
  ],
})
```

## 📚 Resources

- **npm**: https://www.npmjs.com/package/payload-plugin-newsletter
- **GitHub**: https://github.com/aniketpanjwani/payload-plugin-email-newsletter
- **Documentation**: [README.md](https://github.com/aniketpanjwani/payload-plugin-email-newsletter#readme)
- **Issues**: https://github.com/aniketpanjwani/payload-plugin-email-newsletter/issues

## 🤝 Contributing

We welcome contributions! Check out our [FEEDBACK.md](https://github.com/aniketpanjwani/payload-plugin-email-newsletter/blob/main/FEEDBACK.md) for areas where we'd love community input.

## 🙏 Acknowledgments

Special thanks to the Payload CMS team for creating such an extensible platform!

---

Made with ❤️ by [Aniket Panjwani](https://github.com/aniketpanjwani)