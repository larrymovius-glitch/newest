# Affiliate Pro EZ AD Creator - PRD

## Original Problem Statement
Turnkey business system for people with disabilities and single parents to earn income from home through affiliate marketing. Three apps work together: Store, Affiliate Pro, and EZ AD Creator (AI video generator).

## Architecture
- **Frontend:** React + Tailwind + Shadcn UI (17 pages)
- **Backend:** FastAPI + MongoDB
- **Video Gen:** Sora 2 (Emergent LLM Key)
- **Payments:** Stripe (LIVE key)
- **Email:** Resend
- **Auth:** JWT + Google OAuth (Emergent Auth)
- **Preview URL:** https://ad-creator-hub-4.preview.emergentagent.com

## Implemented Features

### Authentication (LIVE)
- Email/password registration + login (JWT tokens)
- Google OAuth via Emergent Auth
- Protected routes (login required for all features)
- Admin role system

### Pricing & Payments (LIVE Stripe)
- Free: $0 (4 videos/month, basic templates)
- Pro: $9.99/month (unlimited videos, all features)
- Lifetime: $19.99 one-time (everything forever)
- Stripe checkout sessions with payment verification
- Monthly video limit enforcement

### Admin Dashboard
- User list with plan management (upgrade/downgrade/cancel)
- Make/remove admin toggle
- Delete users
- Total revenue, user counts, plan distribution stats

### Video Creation (Sora 2 LIVE)
- Quick Create: Product + Video + Publish in one flow
- Generator: Advanced video creation with templates & suggestions
- Progress tracker with elapsed time
- Batch generation
- Email notifications when video completes (Resend)

### Product Catalog & Cross-App Integration
- Product CRUD with video linking
- Store Feed API (PUBLIC) for amhere4utoday.com
- External APIs (API key secured) for Affiliate Pro
- Integration Settings page with docs

### Pages (17)
Auth, AuthCallback, Home, Quick Create, Generator, Library, Products, Templates, Template Creator, Batch Generator, Gallery, Analytics, Scheduled Posts, Team, Integration, Pricing, PaymentSuccess, Admin

## Known Issues
- Custom domain `ezads.amhere4utoday.com` SSL/DNS (external)

## Backlog
- P1: PayPal integration
- P1: AI Voice-over (ElevenLabs)
- P2: Tutorial/welcome video
- P2: Refactor CSS monolith
