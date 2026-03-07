# Connecting Your Three Apps

This guide provides **copy-paste instructions** you can give to the AI agents working on your other apps (`amhere4utoday.com` and `Affiliate Pro`) so they can connect to EZ AD Creator.

---

## Your App URLs

- **EZ AD Creator**: https://movius-preview.preview.emergentagent.com
- **Store Feed API** (for amhere4utoday.com): https://movius-preview.preview.emergentagent.com/api/store/feed
- **External APIs** (for Affiliate Pro): See below

---

## For amhere4utoday.com (Your Store)

**Give this to the agent building your store:**

> I need you to fetch products from my EZ AD Creator app and display them on this store.
>
> The endpoint is: `GET https://movius-preview.preview.emergentagent.com/api/store/feed`
>
> This is a **public endpoint** - no API key needed.
>
> **Response format:**
> ```json
> {
>   "products": [
>     {
>       "id": "...",
>       "name": "Product Name",
>       "description": "...",
>       "affiliate_link": "https://...",
>       "price": 49.99,
>       "category": "Health & Wellness",
>       "image_url": "...",
>       "promo_videos": [
>         {
>           "id": "...",
>           "video_url": "/api/videos/{id}/download",
>           "prompt": "...",
>           "duration": 4
>         }
>       ]
>     }
>   ],
>   "count": 1
> }
> ```
>
> For each product, display:
> - Product name and description
> - Price
> - Affiliate link (this is where users go to buy)
> - Promo video (if available) - video URL is: `https://movius-preview.preview.emergentagent.com{video_url}`
>
> Fetch this data on page load or with a "Refresh" button.

---

## For Affiliate Pro

**Give this to the agent building Affiliate Pro:**

> I need you to connect this app to my EZ AD Creator to read products and videos.
>
> **Step 1: Get an API Key**
> I'll provide you with an API key. Here it is: `[PASTE YOUR KEY HERE]`
>
> **Step 2: Make API Calls**
> Include the API key in the `X-API-Key` header.
>
> **Endpoints:**
>
> - **Get all products:**
>   ```
>   GET https://movius-preview.preview.emergentagent.com/api/external/products
>   Headers: X-API-Key: [YOUR_KEY]
>   ```
>
> - **Get all videos:**
>   ```
>   GET https://movius-preview.preview.emergentagent.com/api/external/videos
>   Headers: X-API-Key: [YOUR_KEY]
>   ```
>
> - **Create a product (if needed):**
>   ```
>   POST https://movius-preview.preview.emergentagent.com/api/external/products
>   Headers: 
>     X-API-Key: [YOUR_KEY]
>     Content-Type: application/json
>   Body: {
>     "name": "Product Name",
>     "description": "Description",
>     "affiliate_link": "https://...",
>     "price": 29.99,
>     "category": "General"
>   }
>   ```
>
> Products created via this API are automatically published to the store.

---

## How to Get Your API Key

1. Log in to EZ AD Creator
2. Go to **Connect** (in the navigation bar)
3. Click **"New Key"**
4. Enter a name (e.g., "Affiliate Pro" or "Store")
5. Select permissions:
   - `read_products` - to fetch products
   - `write_products` - to create/update products
   - `read_videos` - to fetch generated videos
6. Click **"Generate API Key"**
7. **Copy the key immediately** - it won't be shown in full again

---

## The Flow

```
┌─────────────────────┐
│   EZ AD Creator     │
│   (This App)        │
├─────────────────────┤
│ - Create products   │
│ - Generate videos   │
│ - Publish to store  │
└─────────┬───────────┘
          │
          │ /api/store/feed (public)
          │ /api/external/* (secured)
          ▼
┌─────────────────────┐    ┌─────────────────────┐
│  amhere4utoday.com  │    │    Affiliate Pro    │
│     (Store)         │    │  (Management App)   │
├─────────────────────┤    ├─────────────────────┤
│ - Displays products │    │ - Manages campaigns │
│ - Shows promo vids  │    │ - Tracks products   │
│ - Affiliate links   │    │ - Reads videos      │
└─────────────────────┘    └─────────────────────┘
```

---

## Testing the Connection

You can test the store feed right now by visiting:
https://movius-preview.preview.emergentagent.com/api/store/feed

You should see any products you've published from EZ AD Creator.

---

## Troubleshooting

**"No products showing"**
- Make sure you've published at least one product in EZ AD Creator
- Go to Products > click a product > click "Publish to Store"

**"401 Unauthorized"**
- You're using a secured endpoint without an API key
- Make sure to include `X-API-Key: your-key-here` in the request headers

**"403 Forbidden"**  
- Your API key doesn't have the required permission
- Create a new key with the correct permissions

---

## Need Help?

The Integration page in EZ AD Creator shows all the endpoint URLs and lets you manage your API keys. Go to:
https://movius-preview.preview.emergentagent.com/integration
