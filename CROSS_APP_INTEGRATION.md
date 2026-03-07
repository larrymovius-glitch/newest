# Cross-App Integration Guide

## System Overview

Three apps that work together:
1. **EZ AD Creator** (this app) — AI video generator + product catalog + store feed
2. **Affiliate Pro** — Affiliate marketing management
3. **amhere4utoday.com** — Customer-facing store

## How They Connect

```
EZ AD Creator (Central Hub)
    ├── /api/store/feed (PUBLIC) ──→ amhere4utoday.com reads published products
    ├── /api/external/products (SECURED) ──→ Affiliate Pro reads/writes products
    └── /api/external/videos (SECURED) ──→ Affiliate Pro reads completed videos
```

---

## For the amhere4utoday.com Store Agent

### What to tell the agent:

> "My product data comes from an external API. Fetch products from this URL and display them as store items. Each product has a name, description, price, affiliate link, and promo videos."

### Store Feed Endpoint (PUBLIC — no authentication needed):

```
GET https://movius-preview.preview.emergentagent.com/api/store/feed
```

### Response Format:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Health Supplement Bundle",
      "description": "Premium vitamins...",
      "affiliate_link": "https://...",
      "price": 49.99,
      "category": "Health & Wellness",
      "image_url": "https://...",
      "promo_videos": [
        {
          "id": "video-uuid",
          "prompt": "Video description",
          "video_url": "/api/videos/{id}/download",
          "duration": 4,
          "size": "1280x720"
        }
      ],
      "created_at": "2026-03-06T...",
      "updated_at": "2026-03-06T..."
    }
  ],
  "count": 1
}
```

### How the store should use this:
1. On page load, fetch from the store feed URL
2. Display each product as a store item (name, description, price)
3. The `affiliate_link` is the "Buy Now" button destination
4. If `promo_videos` exist, embed them on the product page
5. Video download URL: `https://movius-preview.preview.emergentagent.com{video_url}`

### Single product endpoint:
```
GET https://movius-preview.preview.emergentagent.com/api/store/feed/{product_id}
```

---

## For the Affiliate Pro Agent

### What to tell the agent:

> "I need to connect to an external API to manage products and access generated videos. Use these secured endpoints with the API key in the X-API-Key header."

### API Key:
Create one in the EZ AD Creator app at: `/integration` page
The key goes in the `X-API-Key` header of every request.

### Secured Endpoints:

#### Read Products
```
GET https://movius-preview.preview.emergentagent.com/api/external/products
Headers: X-API-Key: ezad-xxxxxxxxxxxxx
```

#### Create a Product (auto-publishes to store)
```
POST https://movius-preview.preview.emergentagent.com/api/external/products
Headers: 
  X-API-Key: ezad-xxxxxxxxxxxxx
  Content-Type: application/json
Body: {
  "name": "Product Name",
  "description": "Product description",
  "affiliate_link": "https://affiliate-link.com",
  "price": 29.99,
  "category": "Health & Wellness"
}
```

#### Read Completed Videos
```
GET https://movius-preview.preview.emergentagent.com/api/external/videos
Headers: X-API-Key: ezad-xxxxxxxxxxxxx
```

### Permissions:
- `read_products` — View the product catalog
- `write_products` — Create and update products (auto-lists in store)
- `read_videos` — View completed video details

---

## Quick Test Commands

### Test Store Feed (no auth):
```bash
curl https://movius-preview.preview.emergentagent.com/api/store/feed
```

### Test External API (with auth):
```bash
curl https://movius-preview.preview.emergentagent.com/api/external/products \
  -H "X-API-Key: YOUR_KEY_HERE"
```

### Create Product from Affiliate Pro:
```bash
curl -X POST https://movius-preview.preview.emergentagent.com/api/external/products \
  -H "X-API-Key: YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Product","description":"Great product","affiliate_link":"https://example.com","price":19.99}'
```
