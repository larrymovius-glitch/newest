# 🎬 Affiliate Pro Video Generator

**Another development by Movius**

AI-powered video generation platform for creating stunning tutorial and promotional videos in seconds.

---

## 🚀 Quick Links

- **📖 Full Integration Guide**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **🌐 Live App**: https://movius-preview.preview.emergentagent.com
- **🏪 Store**: amhere4utoday.com

---

## ✨ Features

### Core Features
1. **AI Video Generation** - Sora 2 & Pro quality
2. **Professional Templates** - 8 built-in templates
3. **Custom Template Creator** - Save your own prompts
4. **Batch Generation** - Create multiple videos at once
5. **Video Library** - Manage all your videos
6. **Community Gallery** - Share and discover videos
7. **Analytics Dashboard** - Track performance metrics
8. **Scheduled Posts** - Auto-post to social media
9. **Team Collaboration** - Invite team members
10. **AI Suggestions** - Get inspired with trending styles

### Premium Features
- Multiple resolutions (HD, Widescreen, Portrait, Square)
- Video durations (4s, 8s, 12s)
- Like and share system
- Performance tracking
- Multi-platform scheduling

---

## 🛍️ Integration with Your Store

This app is designed to work alongside **Affiliate Pro** as part of your product ecosystem on **amhere4utoday.com**.

### Recommended Setup:
```
amhere4utoday.com               → Main store
affiliate.amhere4utoday.com     → Affiliate Pro app
video.amhere4utoday.com         → Video Generator app
```

**See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for complete integration instructions.**

---

## 💰 Pricing Strategy

Sell through your store with these tiers:

- **Video Generator**: $3.99/month or $29.99/lifetime
- **Affiliate Pro**: $9.99/month or $99.99/lifetime
- **Complete Bundle**: $12.99/month or $129.99/lifetime

---

## 🎨 Design

- **Theme**: Dark purple/navy with gradient accents
- **Colors**: Blue → Purple → Pink gradients
- **Branding**: "Another development by Movius" in cursive
- **Effects**: Pulsing buttons, floating particles, animated cards

---

## 🔧 Tech Stack

- **Frontend**: React + TailwindCSS + Lucide Icons
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **AI**: Sora 2 (OpenAI) via Emergent LLM Key
- **Hosting**: Emergent Platform (Kubernetes)

---

## 📦 Deployment

### Prerequisites:
1. Emergent account with credits
2. Emergent LLM key funded
3. Domain configured (amhere4utoday.com)

### Steps:
1. Click **Deploy** in Emergent UI
2. Wait 10-15 minutes for deployment
3. Click **Link domain** → Enter: `video.amhere4utoday.com`
4. Update DNS records
5. Test and launch!

**See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed deployment instructions.**

---

## 🎯 User Journey

```
Store Visit → Browse Products → Purchase Subscription
    ↓
Receive Welcome Email with Access Links
    ↓
Access Apps:
  - Affiliate Pro: Manage affiliate business
  - Video Generator: Create promotional videos
    ↓
Create Videos → Share to Gallery → Earn Commissions
```

---

## 📁 Project Structure

```
/app
├── backend/
│   ├── server.py           # FastAPI application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Global styles
│   │   └── pages/         # All page components
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend environment
└── INTEGRATION_GUIDE.md   # Full integration docs
```

---

## 🔑 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-xxx
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://movius-preview.preview.emergentagent.com
```

---

## 🎬 Video Generation

### Using Emergent LLM Key:
1. Go to **Profile → Universal Key**
2. Add balance for Sora 2 usage
3. Enable auto top-up (optional)
4. Start generating videos!

### Supported Models:
- **sora-2**: Standard quality
- **sora-2-pro**: Professional quality

### Resolutions:
- HD: 1280x720
- Widescreen: 1792x1024
- Portrait: 1024x1792 (social media)
- Square: 1024x1024

---

## 📊 Analytics

Track video performance:
- Total views, likes, shares
- Per-video engagement rates
- Community gallery performance
- Scheduled posts status

---

## 🤝 Team Features

- Invite team members via email
- Role-based access (Admin/Member)
- Shared templates and videos
- Collaborative video creation

---

## 🔗 Cross-App Integration

### With Affiliate Pro:
- Create videos for affiliate promotions
- Share videos with affiliate links
- Track video performance alongside commissions
- Unified branding across both apps

---

## 📧 Support

For help with:
- Deployment issues
- Custom domain setup
- Payment integration
- Feature requests

Contact: support@amhere4utoday.com

---

## 📝 License

Proprietary - Owned by Movius / Amhere4utoday

---

## 🙏 Credits

- **Design**: Movius software design
- **Development**: Built with Emergent
- **AI**: Powered by OpenAI Sora 2
- **Platform**: Emergent.sh

---

**Ready to Deploy?** Follow the [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for complete setup instructions!
