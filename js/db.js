import { products as customMockData } from './mockData.js';

class Database {
  constructor() {
    this.initCheck();
  }

  initCheck() {
    const existing = JSON.parse(localStorage.getItem('lumina_products') || 'null');
    // Seed if missing OR empty (handles corrupt/cleared state)
    if (!existing || !Array.isArray(existing) || existing.length === 0) {
      localStorage.setItem('lumina_products', JSON.stringify(customMockData));
    } else {
      // Migration: add stock field to existing products if missing
      let changed = false;
      existing.forEach((p, i) => {
        if (p.stock === undefined) { existing[i].stock = 5; changed = true; }
      });
      if (changed) localStorage.setItem('lumina_products', JSON.stringify(existing));
    }
    if (!localStorage.getItem('lumina_cart')) localStorage.setItem('lumina_cart', JSON.stringify([]));
    if (!localStorage.getItem('lumina_promoCodes')) {
      localStorage.setItem('lumina_promoCodes', JSON.stringify([
        { code: 'LUMINA10', discount: 10, type: 'percent' },
        { code: 'COASTAL20', discount: 20, type: 'percent' },
        { code: 'VIP50', discount: 50, type: 'fixed' }
      ]));
    }
  }

  // --- PRODUCTS ---
  getProducts() { return JSON.parse(localStorage.getItem('lumina_products')) || []; }

  addProduct(obj) {
    const products = this.getProducts();
    obj.id = products.reduce((max, p) => p.id > max ? p.id : max, 0) + 1;
    obj.stock = obj.stock || 5;
    products.push(obj);
    localStorage.setItem('lumina_products', JSON.stringify(products));
    return obj;
  }

  updateProductStock(productId, newStock) {
    const products = this.getProducts();
    const idx = products.findIndex(p => p.id === productId);
    if (idx !== -1) { products[idx].stock = newStock; localStorage.setItem('lumina_products', JSON.stringify(products)); }
  }

  // --- CART ---
  getCart() { return JSON.parse(localStorage.getItem('lumina_cart')) || []; }
  addToCart(product) {
    const cart = this.getCart();
    cart.push(product);
    localStorage.setItem('lumina_cart', JSON.stringify(cart));
  }
  removeFromCart(index) {
    const cart = this.getCart();
    if (index >= 0 && index < cart.length) { cart.splice(index, 1); localStorage.setItem('lumina_cart', JSON.stringify(cart)); }
  }
  clearCart() { localStorage.setItem('lumina_cart', JSON.stringify([])); }

  // --- FAVORITES ---
  getFavorites() { return JSON.parse(localStorage.getItem('lumina_favs')) || []; }
  toggleFavorite(productId) {
    let favs = this.getFavorites();
    if (favs.includes(productId)) favs = favs.filter(id => id !== productId);
    else favs.push(productId);
    localStorage.setItem('lumina_favs', JSON.stringify(favs));
    return favs.includes(productId);
  }

  // --- ORDERS ---
  getOrders() { return JSON.parse(localStorage.getItem('lumina_orders')) || []; }
  addOrder(totalPrice, itemCount, giftWrap = false) {
    const orders = this.getOrders();
    orders.push({ date: new Date().toISOString(), total: totalPrice, items: itemCount, giftWrap });
    localStorage.setItem('lumina_orders', JSON.stringify(orders));
    // Award loyalty points: 1 pt per dollar
    this.addLoyaltyPoints(Math.floor(totalPrice));
  }

  // --- REVIEWS ---
  getReviews(productId) { return (JSON.parse(localStorage.getItem('lumina_reviews')) || {})[productId] || []; }
  addReview(productId, reviewObj) {
    const all = JSON.parse(localStorage.getItem('lumina_reviews')) || {};
    if (!all[productId]) all[productId] = [];
    all[productId].unshift({ ...reviewObj, date: new Date().toLocaleDateString() });
    localStorage.setItem('lumina_reviews', JSON.stringify(all));
  }

  // --- HOLDS ---
  getHolds() { return JSON.parse(localStorage.getItem('lumina_holds')) || {}; }
  holdProduct(productId) {
    const holds = this.getHolds();
    holds[productId] = Date.now() + (48 * 60 * 60 * 1000);
    localStorage.setItem('lumina_holds', JSON.stringify(holds));
  }
  releaseHold(productId) {
    const holds = this.getHolds();
    delete holds[productId];
    localStorage.setItem('lumina_holds', JSON.stringify(holds));
  }
  isHeld(productId) {
    const holds = this.getHolds();
    if (!holds[productId]) return false;
    if (Date.now() > holds[productId]) { this.releaseHold(productId); return false; }
    return holds[productId];
  }

  // --- PROMO CODES ---
  getPromoCodes() { return JSON.parse(localStorage.getItem('lumina_promoCodes')) || []; }
  addPromoCode(obj) {
    const codes = this.getPromoCodes();
    codes.push(obj);
    localStorage.setItem('lumina_promoCodes', JSON.stringify(codes));
  }
  removePromoCode(code) {
    localStorage.setItem('lumina_promoCodes', JSON.stringify(this.getPromoCodes().filter(c => c.code !== code)));
  }
  validatePromoCode(code) {
    return this.getPromoCodes().find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
  }

  // --- LOYALTY POINTS ---
  getLoyaltyPoints() { return parseInt(localStorage.getItem('lumina_loyalty') || '0'); }
  addLoyaltyPoints(points) {
    localStorage.setItem('lumina_loyalty', this.getLoyaltyPoints() + points);
  }
  redeemLoyaltyPoints(points) {
    const current = this.getLoyaltyPoints();
    if (current < points) return false;
    localStorage.setItem('lumina_loyalty', current - points);
    return true;
  }

  // --- RECENTLY VIEWED ---
  getRecentlyViewed() { return JSON.parse(localStorage.getItem('lumina_recent')) || []; }
  addRecentlyViewed(productId) {
    let recent = this.getRecentlyViewed().filter(id => id !== productId);
    recent.unshift(productId);
    recent = recent.slice(0, 5); // keep last 5
    localStorage.setItem('lumina_recent', JSON.stringify(recent));
  }

  // --- INQUIRIES (Custom Order Submissions) ---
  getInquiries() { return JSON.parse(localStorage.getItem('lumina_inquiries')) || []; }
  addInquiry(obj) {
    const inquiries = this.getInquiries();
    inquiries.unshift({ ...obj, date: new Date().toISOString(), status: 'New' });
    localStorage.setItem('lumina_inquiries', JSON.stringify(inquiries));
  }
  updateInquiryStatus(index, status) {
    const inquiries = this.getInquiries();
    if (inquiries[index]) { inquiries[index].status = status; localStorage.setItem('lumina_inquiries', JSON.stringify(inquiries)); }
  }
}

export const db = new Database();
