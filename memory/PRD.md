# Affiliate Pro EZ AD Creator - PRD

## Original Problem Statement
Build an AI Video Generator app called "Affiliate Pro EZ AD Creator" that helps people with physical disabilities, single parents earn income from home through affiliate marketing. The app uses Sora 2 AI to create promotional videos for affiliate products. Three apps work together as a turnkey system.

## System Overview
1. **amhere4utoday.com** — Store (pulls published products from EZ AD Creator store feed API)
2. **Affiliate Pro** — Affiliate marketing management (reads/writes products via secured API)
3. **EZ AD Creator** (this app) — Central hub: AI video generator + Product catalog + Store feed

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI (13 pages)
- **Backend:** FastAPI (Python) with MongoDB
- **Video Gen:** Sora 2 via emergentintegrations (Emergent LLM Key)
- **Preview URL:** https://ad-creator-hub-4.preview.emergentagent.com

## Implemented Features

### Core Video Creation
- Sora 2 AI video generation (LIVE, async background tasks with thread pool)
- 8 built-in templates + custom template creation
- Video Library with download/share/delete
- Batch video generation
- Progress tracker with elapsed time

### Quick Create (NEW - one-click flow)
- Step 1: Create or select product
- Step 2: Describe promo video (with quick prompt buttons)
- Step 3: AI generates video (progress indicator)
- Step 4: Review video → Approve & Publish to Store OR Retry

### Product Catalog & Integration
- Full CRUD for affiliate products
- Link promo videos to products
- Publish/unpublish products to store
- Store Feed API (PUBLIC) for amhere4utoday.com
- External APIs (secured with API keys) for Affiliate Pro
- API Key management with granular permissions
- Integration Settings page with step-by-step guide

### Community & Analytics
- Community Gallery with likes and sharing
- Analytics Dashboard (views, likes, shares, engagement)
- Scheduled Posts management
- Team collaboration

### Navigation & UX
- Persistent navbar on all pages (except home)
- Quick Create as primary CTA on home page
- Mobile-responsive hamburger menu

## Frontend Pages (13 total)
Home, Quick Create, Generator, Library, Products, Templates, Template Creator, Batch Generator, Gallery, Analytics, Scheduled Posts, Team, Integration

## Known Issues
- Custom domain `ezads.amhere4utoday.com` SSL/DNS error (external)

## Backlog
- P1: AI Voice-over (ElevenLabs) — UI exists, backend needed
- P1: Tutorial/welcome video
- P2: User authentication (JWT)
- P2: Refactor monolithic App.css
- P2: Convert hardcoded content to DB-backed
