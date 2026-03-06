# Affiliate Pro EZ AD Creator - PRD

## Original Problem Statement
Build an AI Video Generator app called "Affiliate Pro EZ AD Creator" that helps people with physical disabilities, single parents earn income from home through affiliate marketing. The app uses Sora 2 AI to create promotional videos for affiliate products.

## System Overview
Three-part turnkey business:
1. **amhere4utoday.com** - Main store/landing page
2. **Affiliate Pro** - Existing app for managing affiliate marketing
3. **EZ AD Creator** (this app) - AI video generator for affiliate product promo videos

## Core Requirements
- Dark, modern, gradient-heavy aesthetic matching Affiliate Pro branding
- Sora 2 video generation (text-to-video)
- Simple, accessible interface for non-technical users
- Template system for quick video creation
- Community gallery for sharing videos
- Analytics dashboard for tracking performance

## Architecture
- **Frontend:** React + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python) with MongoDB
- **Video Gen:** Sora 2 via emergentintegrations (Emergent LLM Key)
- **Preview URL:** https://ad-creator-hub-4.preview.emergentagent.com

## What's Been Implemented

### Backend (server.py)
- POST /api/videos/generate - Real Sora 2 video generation (async background tasks)
- POST /api/videos/batch-generate - Batch video generation
- GET /api/videos - List all videos
- GET /api/videos/{id} - Get video status
- GET /api/videos/{id}/download - Download video file
- POST /api/videos/{id}/share - Share to gallery
- POST /api/videos/{id}/like - Like a video
- DELETE /api/videos/{id} - Delete a video
- GET /api/templates - Get all templates (8 built-in + custom)
- POST /api/templates - Create custom template
- DELETE /api/templates/{id} - Delete custom template
- GET /api/gallery - Community gallery
- GET /api/analytics/overview - Analytics overview
- GET /api/videos/{id}/analytics - Per-video analytics
- POST /api/videos/{id}/schedule - Schedule social posts
- GET /api/scheduled-posts - List scheduled posts
- GET /api/team - Team members
- POST /api/team/invite - Invite team member

### Frontend Pages
- Home (/) - Landing page with feature cards
- Generator (/generate) - Video creation with progress tracker, AI suggestions
- Library (/library) - Video library with download/share/delete
- Templates (/templates) - 8 built-in templates + custom, category filter
- Batch Generator (/batch) - Create multiple videos at once
- Gallery (/gallery) - Community shared videos
- Analytics (/analytics) - Stats cards + performance table
- Template Creator (/template-creator) - Save custom templates
- Scheduled Posts (/scheduled) - Manage scheduled posts
- Team (/team) - Team member management

### UX Improvements (This Session)
- Persistent navbar on all pages (except home)
- Progress tracker with elapsed time and step indicators during video generation
- Removed back buttons (navbar handles navigation)
- Fixed CSS brace issues causing layout breakage
- Proper 4-column analytics grid
- 3-column template grid with proper category chip spacing

## Known Issues
- Custom domain `ezads.amhere4utoday.com` has SSL/DNS error (external blocker)
- Preview URL works fine as temporary solution

## Backlog (P1/P2)
- P1: AI Voice-over (ElevenLabs integration) - UI exists, backend needed
- P1: Welcome/tutorial video creation
- P2: User authentication (JWT-based login)
- P2: Refactor monolithic App.css into component styles
- P2: Convert hardcoded content to database-backed
- P2: Connect Stripe/PayPal payment buttons on store
- P2: Configure automated welcome email with app links
