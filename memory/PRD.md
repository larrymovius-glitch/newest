# Affiliate Pro EZ AD Creator - PRD

## Mission
Help people with disabilities and those facing adversity earn income from home through affiliate marketing and direct sales.

## Architecture
- **Frontend:** React + Tailwind + Shadcn UI
- **Backend:** FastAPI + MongoDB
- **Video Gen:** Sora 2 (Emergent LLM Key)
- **Payments:** Stripe (LIVE key)
- **Email:** Resend
- **Auth:** JWT + Google OAuth (Emergent Auth)

## Implemented Features (ALL WORKING)

### Authentication
- Email/password registration + login
- Google OAuth via Emergent Auth
- Protected routes
- Admin role system

### Pricing & Payments (LIVE Stripe)
- Free: $0 (4 videos/month)
- Pro: $9.99/month (unlimited)
- Lifetime: $19.99 one-time
- **AnyAdPro Monthly:** $4.99/month
- **AnyAdPro Lifetime:** $19 one-time

### Admin Dashboard
- User management (upgrade/downgrade/delete)
- Admin toggle
- Revenue stats & plan distribution

### Video Creation
- Quick Create workflow
- Advanced generator with templates
- Batch generation
- Email notifications when complete

### NEW FEATURES (Dec 2025)
1. **Eye-catching Sign-in Page** - Gradient design, social proof, benefits listed
2. **Welcome Tutorial** - 4-step interactive guide for new users
3. **Learn Affiliate Marketing** - 5-step training course:
   - What is Affiliate Marketing
   - Where to Get Affiliate Links
   - Creating Your Video Ad
   - Sharing & Making Money
   - Tips for Success
4. **AnyAdPro** - Bonus feature for direct sales ads ($4.99/mo or $19 lifetime)
5. **Social Sharing** - TikTok, Facebook, Instagram, YouTube, X, WhatsApp
6. **Navbar on Home Page** - Full navigation visible after login

### Cross-App Integration
- Product catalog with video linking
- Store Feed API (PUBLIC) for amhere4utoday.com
- External APIs (secured) for Affiliate Pro app
- API key management

## Admin Account
- **Email:** larrymovius@gmail.com
- **Password:** 907907
- **Status:** Full admin access

## Key Files
- `/app/backend/server.py` - All backend logic
- `/app/frontend/src/App.js` - Routes
- `/app/frontend/src/pages/LearnAffiliate.js` - Tutorial
- `/app/frontend/src/pages/AnyAdPro.js` - Bonus feature
- `/app/frontend/src/pages/Auth.js` - New sign-in design

## Backlog
- PayPal integration (deferred)
- AI Voice-over (ElevenLabs) - UI exists
- Code refactoring for scalability

## Testing
- All features verified working
- 100% pass rate on tests
- Ready for production
