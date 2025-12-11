# AI Product Summary Theme Extension

This Shopify theme app extension adds AI-powered features to your product pages.

## Features

### Product AI Reviews (Active)
- 🤖 AI-enhanced customer reviews with sentiment analysis
- 😊 Color-coded sentiment (positive/negative/neutral)
- ⭐ Star ratings and review statistics
- 💡 AI-generated summaries and key points
- 📊 Helpfulness scores
- 📱 Fully responsive mobile design
- 🔄 Auto-hides if no reviews exist

### Product AI Summary (Coming Soon)
- ✨ Beautiful purple-bordered design
- 🤖 AI-generated product descriptions
- ⚡ Cached responses for better performance

## Quick Start

See [QUICK_START_AI_REVIEWS.md](../../QUICK_START_AI_REVIEWS.md) for immediate setup.

## Installation

### 1. Start Required Servers

```bash
# Terminal 1: Backend server
npm run backend

# Terminal 2: Shopify app
npm run dev
```

### 2. Deploy the Extension

```bash
npm run deploy
# or
shopify app deploy
```

### 3. Activate in Theme Editor

1. Go to your Shopify Admin
2. Navigate to **Online Store > Themes**
3. Click **Customize** on your active theme
4. Go to any **Product page**
5. In the left sidebar, click **Add block**
6. Find and select **Product AI Reviews** under "App blocks"
7. Position it where you want (recommended: below product description)
8. Click **Save**

### 4. Verify App Proxy

The app proxy is configured in `shopify.app.toml`:
```toml
[app_proxy]
url = "/apps/ai-reviews"
subpath = "ai-reviews"
prefix = "apps"
```

This creates the public endpoint: `/apps/ai-reviews`

## How It Works

### AI Reviews Block

1. Block is added to product page template in theme editor
2. When customer views product, JavaScript executes client-side
3. Fetches reviews: `GET /apps/ai-reviews?product={productTitle}`
4. App proxy routes to MongoDB `judgeme_ai_reviews` collection
5. Reviews rendered with sentiment analysis, ratings, and AI insights
6. Block auto-hides if no reviews exist for product

### Data Flow

```
Product Page
    ↓
Liquid Block (with product.title)
    ↓
JavaScript Fetch to /apps/ai-reviews
    ↓
App Proxy Route (app/routes/apps/ai-reviews.jsx)
    ↓
MongoDB Query (judgeme_ai_reviews)
    ↓
JSON Response with AI Analysis
    ↓
Dynamic Rendering with Sentiment Colors
```

## Customization

### Styling (AI Reviews)

Edit CSS in `blocks/ai-reviews.liquid` (lines 6-195):

**Sentiment Colors:**
- Positive: `#28a745` (green)
- Negative: `#dc3545` (red)
- Neutral: `#ffc107` (yellow)

**Layout:**
- Max height: `400px` (line 43)
- Container padding: `20px` (line 9)
- Card spacing: `16px` (line 48)

**Responsive:**
- Mobile breakpoint: `768px` (line 178)

### Content

Modify JavaScript rendering functions (lines 221-268):
- `renderStars()` - Star display
- `renderKeyPoints()` - Key points formatting
- `renderHelpfulness()` - Helpfulness score display

## Troubleshooting

**Block not showing in theme editor?**
- Run `npm run deploy` to deploy extension
- Refresh the theme editor
- Look under "App blocks" section

**No reviews displayed?**
- Check backend is running: `npm run backend`
- Verify product titles match exactly in MongoDB (case-sensitive)
- Test endpoint: `curl "http://localhost:3001/api/ai-reviews?limit=1"`
- Check browser console for JavaScript errors

**Reviews exist but not showing?**
- Product title mismatch (must be exact)
- Check MongoDB query: `db.judgeme_ai_reviews.find({ productTitle: "Exact Name" })`
- Verify app proxy is configured correctly

**Styling issues?**
- Check your theme's CSS for conflicts
- Use browser DevTools to inspect
- Add `!important` to critical styles
- Increase CSS specificity

## API Endpoints

### Public (Storefront)

**GET** `/apps/ai-reviews?product={productTitle}`

Fetches all AI reviews for specified product from MongoDB.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "productTitle": "Green Star Charm",
      "originalRating": 5,
      "aiSummary": "AI-generated summary...",
      "sentimentAnalysis": {
        "sentiment": "positive",
        "confidence": 0.9
      },
      "keyPoints": ["Point 1", "Point 2"],
      "helpfulnessScore": 0.8,
      "reviewerName": "John Doe"
    }
  ]
}
```

### Admin (Internal)

See [app/routes/api.ai-reviews.jsx](../../app/routes/api.ai-reviews.jsx) for:
- POST `/api/ai-reviews/generate` - Generate AI reviews
- GET `/api/ai-reviews/stats` - Get statistics
- GET `/api/ai-reviews/sentiment-distribution` - Sentiment breakdown

## Generating AI Reviews

### Via Admin UI:
1. Go to `/app/ai-reviews` in Shopify admin
2. Click "Generate AI Reviews" button
3. Wait for processing

### Via API:
```bash
curl -X POST http://localhost:3001/api/ai-reviews/generate
```

Processes reviews using Groq AI (meta-llama/llama-4-scout-17b-16e-instruct).

## Current Status

- ✅ 47 AI reviews in MongoDB
- ✅ Backend server on port 3001
- ✅ App proxy configured
- ✅ Liquid block implemented
- ✅ Extension configured
- ⏳ Ready to deploy

## File Structure

```
extensions/ai-product-summary/
├── blocks/
│   ├── ai-reviews.liquid       # AI Reviews (ACTIVE)
│   └── ai-summary.liquid        # AI Summary (disabled)
├── locales/
│   └── en.default.json
├── shopify.extension.toml       # Extension config
└── README.md                    # This file
```

## Complete Guides

- [Quick Start](../../QUICK_START_AI_REVIEWS.md) - Get started in 3 steps
- [Full Setup Guide](../../PRODUCT_PAGE_AI_REVIEWS_SETUP.md) - Comprehensive documentation
- [Troubleshooting](../../AI_REVIEWS_TROUBLESHOOTING.md) - Common issues and fixes
