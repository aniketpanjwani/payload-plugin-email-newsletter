# Broadcast Overview

Broadcast is a self-hosted email marketing platform for Ubuntu servers. It operates on a one-time license model rather than subscriptions.

**Website:** https://sendbroadcast.net
**Contact:** simon@sendbroadcast.net

## Core Capabilities

- Campaign management and automation
- Subscriber management with segmentation
- Automated sequences (drip campaigns)
- Transactional email delivery
- Built-in analytics and tracking
- RESTful API for integrations
- Webhook support for real-time notifications
- Multiple SMTP server support

## System Requirements

**Minimum:**
- 2 GB RAM
- 1 CPU core
- 40 GB disk space

**Recommended:**
- 4 GB RAM
- 2 CPU cores
- 60+ GB disk space

**OS:** Ubuntu 24.04 LTS (officially supported), Ubuntu 22.04 LTS (compatible)

**Dependencies:** Docker, Git, SSL certificate capability, dedicated IP, domain with DNS control

## API Overview

The API provides endpoints for:
- Broadcasts (email campaigns)
- Subscribers (contacts)
- Segments (audience targeting)
- Sequences (automation)
- Transactional emails

All endpoints require authentication via access tokens.

## Documentation Links

- [Documentation Overview](https://sendbroadcast.net/docs/index)
- [API Authentication](https://sendbroadcast.net/docs/api-authentication)
- [Broadcasts API](https://sendbroadcast.net/docs/api-broadcasts)
- [Subscribers API](https://sendbroadcast.net/docs/api-subscribers)
- [Webhooks](https://sendbroadcast.net/docs/webhooks)
