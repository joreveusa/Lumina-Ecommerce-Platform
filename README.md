# Lumina — Luxury Jewelry E-Commerce Platform

> ⚠️ **Work in Progress** — This project is actively under development and not yet production-ready.

A premium, single-page e-commerce platform for Southwestern and coastal-inspired luxury jewelry. Fully stateful, zero-backend — powered by LocalStorage.

## Status
🚧 Under active development

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Database**: `localStorage` (JSON serialized — no backend required)
- **AI**: Pollinations.ai API (free, no key) for commission confirmation messages
- **Charts**: Pure SVG drawn in JavaScript

## Features (In Progress)
- Product catalog with glassmorphism cards + Quick View modal
- Persistent shopping cart + full checkout flow
- Style quiz → personal lookbook
- Star reviews, hold system, gift wrapping, promo codes
- Commission wizard with AI-generated artisan confirmation
- Certificate of Authenticity generator
- Admin dashboard — revenue metrics, SVG bar chart, promo manager
- AI sales agent chat widget

## Project Structure
```
├── index.html        # Main storefront
├── admin.html        # Admin dashboard
├── css/
│   ├── index.css     # Main styles
│   ├── admin.css     # Admin styles
│   └── design-tokens.css
└── js/
    ├── app.js            # Core application logic
    ├── db.js             # LocalStorage database layer
    ├── salesAgent.js     # AI chat widget
    ├── marketingAgent.js # Marketing automation
    ├── darkMode.js       # Theme toggle
    ├── toast.js          # Notification system
    ├── mockData.js       # Seed data
    └── env.js            # Environment config
```

## Running Locally
Open `index.html` directly in a browser, or:
```bash
npx serve .
# → http://localhost:3000
```

## Deployment
Static site — compatible with Netlify, GitHub Pages, or Vercel.

---
*Private project — not licensed for redistribution.*
