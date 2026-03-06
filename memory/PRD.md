# Affiliate Pro EZ AD Creator - PRD

## Original Problem Statement
Build an AI Video Generator app called "Affiliate Pro EZ AD Creator" that helps people with physical disabilities, single parents earn income from home through affiliate marketing. Uses Sora 2 AI for video creation. Three apps work as a turnkey system.

## System Overview
1. **amhere4utoday.com** — Store (pulls published products from store feed API)
2. **Affiliate Pro** — Affiliate marketing management (reads/writes via secured API)
3. **EZ AD Creator** (this app) — Central hub: AI video + products + store feed + email notifications

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI (14 pages)
- **Backend:** FastAPI (Python) with MongoDB
- **Video Gen:** Sora 2 via emergentintegrations (Emergent LLM Key)
- **Email:** Resend (free tier, transactional notifications)
- **Preview URL:** https://ad-creator-hub-4.preview.emergentagent.com

## Implemented Features

### Core Video Creation
- Sora 2 AI video generation (LIVE, async with thread pool)
- 8 built-in templates + custom template creation
- Video Library, Batch generation, Progress tracker

### Quick Create (one-click flow)
- Step 1: Create/select product → Step 2: Describe video + email → Step 3: Generate → Step 4: Review → Approve & Publish

### Email Notifications (NEW)
- Optional email field on Quick Create and Generator pages
- Automatic email sent when video completes or fails via Resend
- Beautiful branded HTML emails with CTA buttons
- Test email endpoint for verification

### Product Catalog & Cross-App Integration
- Full CRUD for affiliate products, link promo videos
- Publish/unpublish to store, Store Feed API (PUBLIC)
- External APIs (API key secured) for Affiliate Pro
- API Key management, Integration Settings page

### Community & Analytics
- Community Gallery, Analytics Dashboard, Scheduled Posts, Team collaboration

## Frontend Pages (14 total)
Home, Quick Create, Generator, Library, Products, Templates, Template Creator, Batch Generator, Gallery, Analytics, Scheduled Posts, Team, Integration

## Known Issues
- Custom domain `ezads.amhere4utoday.com` SSL/DNS error (external)
- Resend free tier: emails only go to verified addresses in test mode

## Backlog
- P1: AI Voice-over (ElevenLabs)
- P1: Tutorial/welcome video
- P2: User authentication (JWT)
- P2: Refactor monolithic App.css
- P2: Convert hardcoded content to DB-backed
