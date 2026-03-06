# Affiliate Pro EZ AD Creator - PRD

## Original Problem Statement
Build an AI Video Generator app called "Affiliate Pro EZ AD Creator" that helps people with physical disabilities, single parents earn income from home through affiliate marketing. The app uses Sora 2 AI to create promotional videos for affiliate products.

## System Overview
Three-part turnkey business:
1. **amhere4utoday.com** - Main store/landing page (pulls product data from EZ AD Creator)
2. **Affiliate Pro** - Existing app for managing affiliate marketing (reads/writes products via API key)
3. **EZ AD Creator** (this app) - AI video generator + Product Hub + Store Feed

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python) with MongoDB
- **Video Gen:** Sora 2 via emergentintegrations (Emergent LLM Key)
- **Preview URL:** https://ad-creator-hub-4.preview.emergentagent.com

## What's Been Implemented

### Core Features
- Sora 2 AI video generation (LIVE - async background tasks)
- 8 built-in video templates + custom template creation
- Video Library with download/share/delete
- Community Gallery with likes
- Analytics Dashboard (views, likes, shares, engagement)
- Batch video generation
- Team collaboration (invites)
- Scheduled posts

### Cross-App Integration (NEW)
- **Product Catalog** — CRUD for affiliate products, link promo videos
- **Store Feed API** — PUBLIC endpoint for amhere4utoday.com to consume
- **External APIs** — Secured with API keys for Affiliate Pro
- **API Key Management** — Create/revoke keys with granular permissions
- **Integration Settings UI** — Step-by-step guide + endpoint URLs + key manager

### API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/videos/generate | None | Generate video via Sora 2 |
| GET | /api/videos | None | List all videos |
| GET | /api/videos/{id} | None | Get video status |
| GET | /api/videos/{id}/download | None | Download video file |
| POST | /api/videos/{id}/share | None | Share to gallery |
| POST | /api/videos/{id}/like | None | Like a video |
| DELETE | /api/videos/{id} | None | Delete video |
| GET | /api/templates | None | List templates |
| POST | /api/templates | None | Create custom template |
| GET | /api/gallery | None | Community gallery |
| GET | /api/analytics/overview | None | Analytics stats |
| GET | /api/products | None | List products |
| POST | /api/products | None | Create product |
| PUT | /api/products/{id} | None | Update product |
| DELETE | /api/products/{id} | None | Delete product |
| POST | /api/products/{id}/link-video | None | Link video to product |
| POST | /api/products/{id}/publish | None | Publish to store |
| POST | /api/products/{id}/unpublish | None | Remove from store |
| GET | /api/store/feed | PUBLIC | Store reads published products |
| GET | /api/store/feed/{id} | PUBLIC | Single product for store |
| POST | /api/integration/keys | None | Create API key |
| GET | /api/integration/keys | None | List API keys |
| DELETE | /api/integration/keys/{id} | None | Revoke key |
| GET | /api/external/products | API Key | Affiliate Pro reads products |
| POST | /api/external/products | API Key | Affiliate Pro writes products |
| GET | /api/external/videos | API Key | Affiliate Pro reads videos |

### Frontend Pages (12 total)
- Home, Generator, Library, Templates, Template Creator
- Batch Generator, Gallery, Analytics, Scheduled Posts, Team
- **Products** (NEW), **Integration** (NEW)

## Known Issues
- Custom domain `ezads.amhere4utoday.com` has SSL/DNS error (external)

## Backlog
- P1: AI Voice-over (ElevenLabs) - UI exists, backend needed
- P1: Tutorial/welcome video
- P2: User authentication (JWT)
- P2: Refactor monolithic App.css
- P2: Convert hardcoded content to DB-backed
