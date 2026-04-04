# Lumina Store Kit — White-Label Jewelry E-Commerce Template

> **A premium, fully-featured jewelry e-commerce platform** built with vanilla HTML, CSS, and JavaScript.  
> Zero dependencies. No build step. Open `index.html` and it works.

---

## 🎨 What You're Getting

**Lumina Store Kit** is a complete, production-quality jewelry store with features most $5,000+ custom builds don't have:

### Storefront (`index.html`)
- **Product Gallery** with filter by material (Gold, Silver, Turquoise, Coastal Gems) and sort by price/reviews
- **Quick View Modal** — beautiful product popup with image, description, add-to-cart
- **AI Sales Concierge** — chat widget powered by a free AI API (no API key needed)
- **Style Quiz** — 3-step quiz that builds a personal "lookbook" for the customer
- **Certificate of Authenticity** — auto-generated per-product certificate with serial number
- **"Hold This Piece"** — 48-hour product reservation system with live countdown
- **Custom Commission Wizard** — 4-step commission request flow with AI confirmation message
- **Gift Wrapping toggle** at checkout (+$25, with gift note input)
- **Promo Code Engine** — pre-seeded codes, apply at checkout, live total update
- **Star Reviews System** — customers can rate and review products; persists in localStorage
- **"Recently Viewed"** rail — tracks the last 5 products a customer looked at
- **"Complete the Look"** — shows related products inside Quick View
- **Limited Edition Badges** — on designated products
- **Dark Mode** toggle (persists preference)
- **Loyalty Points** — earn 1 point per dollar, redeem 100 pts = $10 off

### Admin Dashboard (`admin.html`)
- **Live Revenue Bar Chart** (pure SVG, no libraries)
- **Order History** table with averages
- **Inventory Manager** — add/edit/delete products
- **Promo Code Manager** — create/delete promo codes
- **Custom Order Inquiries** — view and update status of commission requests
- **Marketing Dashboard** — auto-generated email copy and social post suggestions

---

## 🚀 Getting Started

### Step 1: Open the Store
Double-click `index.html` — that's it. No server, no build step, no npm install.

### Step 2: Customize the Brand
1. **Brand name**: Search for `"Lumina"` in `index.html` and replace with your brand name
2. **Colors**: Open `css/design-tokens.css` — all colors are CSS variables at the top
3. **Products**: Open `js/mockData.js` — edit the products array with your items and prices
4. **Artisan story**: Edit the artisan section in `index.html` (lines ~121-137)
5. **Images**: Replace Unsplash URLs in `mockData.js` with your product photo URLs

### Step 3: Customize Products
Edit `js/mockData.js`:
```js
{
  id: 1,
  name: "Your Product Name",
  category: "Gold",           // Gold | Silver | Turquoise | Coastal Gems (or add your own)
  price: 485,
  description: "Your product description.",
  image: "https://your-image-url.com/photo.jpg",
  stock: 5,
  limited: false              // set true to show Limited Edition badge
}
```

### Step 4: Connect Real Payments (Optional)
The checkout is a demo flow. To take real payments, add a **Stripe Payment Link**:
1. Create a free account at stripe.com
2. Go to Payment Links → Create new link
3. Replace the checkout button with a link to your Stripe checkout URL

### Step 5: Deploy for Free
Drag the entire folder to **Netlify Drop** (drop.netlify.com) — your store is live in 30 seconds with a free URL.

---

## 📁 File Structure

```
lumina-store-kit/
├── index.html          ← Main storefront
├── admin.html          ← Admin dashboard
├── css/
│   ├── design-tokens.css   ← All brand colors/fonts (edit here first)
│   ├── index.css           ← Main storefront styles
│   └── admin.css           ← Admin panel styles
└── js/
    ├── mockData.js         ← Your products (edit this!)
    ├── db.js               ← localStorage database layer
    ├── app.js              ← Main storefront logic
    ├── salesAgent.js       ← AI chat concierge
    ├── marketingAgent.js   ← Admin marketing tools
    ├── darkMode.js         ← Dark mode toggle
    └── toast.js            ← Toast notification system
```

---

## 🎨 Customization Reference

### Colors (in `css/design-tokens.css`)
| Variable | Default | Purpose |
|----------|---------|---------|
| `--desert-gold` | `#c9984a` | Primary accent (buttons, links) |
| `--coastal-blue` | `#2d6a8f` | Secondary accent |
| `--turquoise-gem` | `#3a9d8f` | Highlights |
| `--text-dark` | `#1a1612` | Body text |
| `--crisp-white` | `#fefcf8` | Background |

### Category Filters
To add a new product category, add a filter button in `index.html`:
```html
<button class="filter-btn" data-filter="YourCategory">Your Category</button>
```
Then set `category: "YourCategory"` in your products in `mockData.js`.

---

## 🔧 Promo Codes

Three codes are pre-seeded in `js/db.js`:
- `LUMINA10` — 10% off
- `COASTAL20` — 20% off  
- `VIP50` — $50 flat discount

Change or add codes by editing the array in `db.js` or through the Admin Panel.

---

## ❓ Support

If you have questions about customization, email **[your support email]** or open a conversation on Gumroad.

If you find this template useful, **please leave a review** — it really helps other buyers find it!

---

## 📄 License

**Personal & Commercial Use** — use this for your own jewelry store or client projects.  
**Reselling** — you may not resell this template or include it in other template bundles.

---

*Built with care. No frameworks were harmed in the making of this template.* ✨
