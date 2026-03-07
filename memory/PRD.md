# Affiliate Pro EZ AD Creator - PRD

## Original Problem Statement
Turnkey business system for people with disabilities and single parents to earn income from home through affiliate marketing. Three apps work together: Store (amhere4utoday.com), Affiliate Pro, and EZ AD Creator (AI video generator).

## Architecture
- **Frontend:** React + Tailwind + Shadcn UI (17 pages)
- **Backend:** FastAPI + MongoDB
- **Video Gen:** Sora 2 (Emergent LLM Key)
- **Payments:** Stripe (LIVE key)
- **Email:** Resend
- **Auth:** JWT + Google OAuth (Emergent Auth)
- **Preview URL:** https://movius-preview.preview.emergentagent.com

## Implemented Features (ALL VERIFIED - 100% PASS RATE)

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

## Integration Guide
See `/app/INTEGRATION_GUIDE_V2.md` for copy-paste instructions to connect:
- amhere4utoday.com (Store) - uses public `/api/store/feed`
- Affiliate Pro - uses secured `/api/external/*` endpoints with API keys

## Known External Issues
- Custom domain `ezads.amhere4utoday.com` SSL/DNS - requires user action in GoDaddy and Emergent dashboard

## Recently Added (Dec 2025)
- Welcome Tutorial: 4-step interactive guide for new users
  - Step 1: Welcome & overview
  - Step 2: Add Your Product
  - Step 3: Create Your Video  
  - Step 4: Share & Earn
- "How it Works" floating help button on home page
- Tutorial shows automatically for first-time users, can be re-accessed anytime

## Backlog (Future)
- P1: PayPal integration (user deferred)
- P1: AI Voice-over (ElevenLabs) - UI exists, backend not implemented
- P2: Refactor CSS monolith (App.css)
- P2: Refactor backend into modular routers

## Testing Status
- **Iteration 5:** 100% pass rate (32/32 backend tests, all frontend tests)
- All core features verified working
- Ready for launch

## Key Files
- `/app/backend/server.py` - All backend logic
- `/app/frontend/src/App.js` - Routes
- `/app/frontend/src/context/AuthContext.js` - Auth state
- `/app/frontend/src/pages/QuickCreate.js` - Main workflow
- `/app/INTEGRATION_GUIDE_V2.md` - Integration instructions

## Test Credentials
- Admin: admin@test.com / admin123
