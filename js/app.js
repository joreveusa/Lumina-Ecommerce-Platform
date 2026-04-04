import { db } from './db.js';
import { initSalesAgent } from './salesAgent.js';
import { initToast } from './toast.js';
import { initDarkMode } from './darkMode.js';

const LIMITED_IDS = [1, 3];
const LOW_STOCK_THRESHOLD = 3;

let currentFilter = 'all';
let sortOrder = 'featured';
let priceMin = 0;
let priceMax = Infinity;
let appliedPromo = null;

document.addEventListener('DOMContentLoaded', () => {
  initToast();
  initDarkMode();
  initSalesAgent();
  initSearch();
  initFilters();
  showSkeletons();
  setTimeout(() => { renderGallery(); updateFilterCounts(); initScrollReveal(); }, 500);
  renderRecentlyViewed();
  initCartUI();
  initWishlistDrawer();
  initModal();
  initCertModal();
  initCheckoutModal();
  initStyleQuiz();
  initCustomOrderWizard();
  initStaticModals();
  initNewsletter();
  initFooterLinks();
  initBackToTop();
});

/* ==============================
   SKELETON SCREENS
============================== */
function showSkeletons() {
  const container = document.getElementById('gallery-container');
  if (!container) return;
  container.innerHTML = Array(6).fill(`
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line wide"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>`).join('');
}

/* ==============================
   SCROLL REVEAL
============================== */
function initScrollReveal() {
  const sections = document.querySelectorAll('.artisan-section, .newsletter-section, .recently-viewed');
  sections.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ==============================
   SEARCH OVERLAY
============================== */
function initSearch() {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');

  document.getElementById('search-btn').addEventListener('click', () => {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input.focus(), 150);
  });

  const closeSearch = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    input.value = '';
    resultsContainer.innerHTML = '';
  };

  document.getElementById('search-close').addEventListener('click', closeSearch);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    if (!query) { resultsContainer.innerHTML = ''; return; }
    const products = db.getProducts();
    const matches = products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
    if (!matches.length) {
      resultsContainer.innerHTML = `<div class="search-no-results">No pieces found for "<em>${query}</em>".</div>`;
      return;
    }
    resultsContainer.innerHTML = matches.map(p => `
      <div class="search-result-card" onclick="closeSearchAndOpen(${p.id})">
        <img src="${p.image}" alt="${p.name}">
        <div class="search-result-info">
          <h4>${p.name}</h4>
          <p>${p.category}</p>
          <p class="price">${p.priceStr}</p>
        </div>
      </div>`).join('');
  });

  window.closeSearchAndOpen = (id) => {
    closeSearch();
    setTimeout(() => window.openQuickView(id), 100);
  };
}

/* ==============================
   GALLERY
============================== */
function applyFilters(products) {
  let filtered = products.filter(p => {
    const catMatch = currentFilter === 'all' || p.category === currentFilter;
    const priceMatch = p.priceNum >= priceMin && p.priceNum <= priceMax;
    return catMatch && priceMatch;
  });
  if (sortOrder === 'price-asc') filtered.sort((a, b) => a.priceNum - b.priceNum);
  else if (sortOrder === 'price-desc') filtered.sort((a, b) => b.priceNum - a.priceNum);
  else if (sortOrder === 'reviewed') {
    filtered.sort((a, b) => db.getReviews(b.id).length - db.getReviews(a.id).length);
  }
  return filtered;
}

function renderGallery() {
  const container = document.getElementById('gallery-container');
  if (!container) return;
  const products = db.getProducts();
  const favs = db.getFavorites();
  const filtered = applyFilters(products);

  if (!filtered.length) {
    container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:var(--space-12) 0; grid-column:1/-1;">No pieces match your filters.</p>';
    return;
  }

  container.innerHTML = filtered.map(product => {
    const isFav = favs.includes(product.id);
    const heartFill = isFav ? 'var(--terracotta)' : 'none';
    const heartStroke = isFav ? 'var(--terracotta)' : 'currentColor';
    const isLimited = LIMITED_IDS.includes(product.id);
    const stock = product.stock !== undefined ? product.stock : 5;
    const isLowStock = stock > 0 && stock <= LOW_STOCK_THRESHOLD;
    const hold = db.isHeld(product.id);

    let holdBadgeHtml = '';
    if (hold) {
      const hrs = Math.floor((hold - Date.now()) / 3600000);
      const mins = Math.floor(((hold - Date.now()) % 3600000) / 60000);
      holdBadgeHtml = `<div class="hold-badge">🔒 Held — ${hrs}h ${mins}m remaining</div>`;
    }

    const topBadge = isLimited
      ? '<span class="limited-badge">⏳ Limited</span>'
      : (isLowStock ? `<span class="low-stock-badge">Only ${stock} left</span>` : '');

    return `
      <div class="product-card">
        ${topBadge}
        ${holdBadgeHtml}
        <div class="product-img-wrapper" style="cursor:pointer;" onclick="window.openQuickView(${product.id})">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <button class="fav-btn" onclick="window.toggleFav(${product.id}, this)" title="Save to Wishlist"
          style="position:absolute; top:10px; right:10px; background:white; border:none; padding:8px; border-radius:50%; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.1); z-index:10;" aria-label="Add to Wishlist">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="${heartFill}" stroke="${heartStroke}" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
        <button class="quick-add-btn" onclick="event.stopPropagation(); window.addToCart(${product.id});">+ Add to Bag</button>
        <div class="product-info" style="cursor:pointer;" onclick="window.openQuickView(${product.id})">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-price">${product.priceStr}</p>
        </div>
      </div>`;
  }).join('');
}

function updateFilterCounts() {
  const products = db.getProducts();
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const f = btn.dataset.filter;
    const count = f === 'all' ? products.length : products.filter(p => p.category === f).length;
    const existing = btn.querySelector('.filter-count');
    if (existing) existing.textContent = count;
    else btn.insertAdjacentHTML('beforeend', `<span class="filter-count">${count}</span>`);
  });
}

window.toggleFav = (productId, btnEl) => {
  const isNow = db.toggleFavorite(productId);
  const svg = btnEl.querySelector('svg');
  svg.setAttribute('fill', isNow ? 'var(--terracotta)' : 'none');
  svg.setAttribute('stroke', isNow ? 'var(--terracotta)' : 'currentColor');
  updateWishlistCount();
  window.showToast(isNow ? '❤️ Added to your Wishlist' : 'Removed from Wishlist', 'info');
};

function updateWishlistCount() {
  const count = db.getFavorites().length;
  const badge = document.getElementById('wishlist-count');
  if (!badge) return;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

window.filterToCategory = (cat) => {
  currentFilter = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === cat));
  renderGallery();
  document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
};

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGallery();
    });
  });
  document.getElementById('sort-select').addEventListener('change', (e) => { sortOrder = e.target.value; renderGallery(); });
  const minInput = document.getElementById('price-min');
  const maxInput = document.getElementById('price-max');
  const applyPriceFilter = () => {
    priceMin = parseFloat(minInput.value) || 0;
    priceMax = parseFloat(maxInput.value) || Infinity;
    renderGallery();
  };
  minInput.addEventListener('change', applyPriceFilter);
  maxInput.addEventListener('change', applyPriceFilter);
}

/* ==============================
   RECENTLY VIEWED RAIL
============================== */
function renderRecentlyViewed() {
  const section = document.getElementById('recently-viewed-section');
  const rail = document.getElementById('recently-viewed-rail');
  if (!section || !rail) return;
  const recent = db.getRecentlyViewed();
  if (!recent.length) { section.classList.add('hidden'); return; }
  const products = db.getProducts();
  const items = recent.map(id => products.find(p => p.id === id)).filter(Boolean);
  if (!items.length) { section.classList.add('hidden'); return; }
  section.classList.remove('hidden');
  rail.innerHTML = items.map(p => `
    <div class="recent-item" onclick="window.openQuickView(${p.id})">
      <img src="${p.image}" alt="${p.name}">
      <div class="recent-item-info">
        <div class="name">${p.name}</div>
        <div class="price">${p.priceStr}</div>
      </div>
    </div>`).join('');
}

/* ==============================
   WISHLIST DRAWER
============================== */
function initWishlistDrawer() {
  const drawer = document.getElementById('wishlist-drawer');
  const overlay = document.getElementById('cart-overlay');

  document.getElementById('wishlist-btn').addEventListener('click', () => {
    renderWishlistDrawer();
    drawer.classList.add('active');
    overlay.classList.add('active');
  });
  document.getElementById('close-wishlist').addEventListener('click', () => {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  });

  const addAllBtn = document.getElementById('wishlist-add-all-btn');
  if (addAllBtn) {
    addAllBtn.addEventListener('click', () => {
      const favIds = db.getFavorites();
      const products = db.getProducts();
      favIds.forEach(id => {
        const p = products.find(x => x.id === id);
        if (p) db.addToCart(p);
      });
      updateCartDisplay();
      drawer.classList.remove('active');
      document.getElementById('cart-sidebar').classList.add('active');
      window.showToast(`🛒 ${favIds.length} piece${favIds.length > 1 ? 's' : ''} moved to your bag!`, 'success');
    });
  }
  updateWishlistCount();
}

function renderWishlistDrawer() {
  const container = document.getElementById('wishlist-items-container');
  const footer = document.getElementById('wishlist-footer');
  const favIds = db.getFavorites();
  const products = db.getProducts();
  const items = favIds.map(id => products.find(p => p.id === id)).filter(Boolean);

  if (!items.length) {
    container.innerHTML = '<div class="wishlist-empty">💎 Your wishlist is empty.<br><br>Click the heart on any piece to save it here.</div>';
    if (footer) footer.style.display = 'none';
    return;
  }
  if (footer) footer.style.display = '';

  container.innerHTML = items.map(p => `
    <div class="wishlist-item">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="wishlist-item-info">
        <div class="wishlist-item-name">${p.name}</div>
        <div class="wishlist-item-price">${p.priceStr}</div>
      </div>
      <div class="wishlist-item-actions">
        <button class="wl-add-btn" onclick="window.addToCart(${p.id}); window.showToast('Added to bag!','success');">Add to Bag</button>
        <button class="wl-remove-btn" onclick="window.removeFromWishlist(${p.id}, this)">Remove</button>
      </div>
    </div>`).join('');
}

window.removeFromWishlist = (productId, btn) => {
  db.toggleFavorite(productId); // toggles off since it's in favs
  updateWishlistCount();
  renderWishlistDrawer();
  renderGallery(); // refresh heart icons
  window.showToast('Removed from wishlist.', 'info');
};

/* ==============================
   QUICK VIEW MODAL
============================== */
let activeProductId = null;

function initModal() {
  const modal = document.getElementById('quick-view-modal');
  document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('active'));

  window.openQuickView = (productId) => {
    const products = db.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    activeProductId = productId;
    db.addRecentlyViewed(productId);

    document.getElementById('modal-image').src = product.image;
    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-price').textContent = product.priceStr;
    document.getElementById('modal-category').textContent = product.category;
    document.getElementById('modal-desc').textContent = product.description;

    const stock = product.stock !== undefined ? product.stock : 5;
    const stockEl = document.getElementById('modal-stock');
    if (stock <= LOW_STOCK_THRESHOLD) stockEl.innerHTML = `⚠️ Only <strong>${stock}</strong> left in stock!`;
    else stockEl.textContent = `✓ In Stock — ${stock} available`;

    renderReviews(productId);

    const others = products.filter(p => p.id !== productId && p.category === product.category).slice(0, 3);
    const lookSection = document.getElementById('complete-look-section');
    const lookContainer = document.getElementById('complete-look-items');
    lookSection.style.display = others.length ? '' : 'none';
    lookContainer.innerHTML = others.map(o => `
      <div class="look-item" onclick="window.openQuickView(${o.id})">
        <img src="${o.image}" alt="${o.name}">
        <div class="look-item-info"><div class="name">${o.name}</div><div class="price">${o.priceStr}</div></div>
      </div>`).join('');

    const holdBtn = document.getElementById('hold-btn');
    const isHeld = db.isHeld(productId);
    holdBtn.textContent = isHeld ? '🔒 On Hold' : '🔒 Hold Piece';
    holdBtn.disabled = !!isHeld;

    modal.classList.add('active');
    setTimeout(renderRecentlyViewed, 300);
  };

  // Share button
  const shareBtn = document.getElementById('share-product-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const product = db.getProducts().find(p => p.id === activeProductId);
      if (!product) return;
      const text = `✨ ${product.name} — ${product.priceStr} — Check it out at Lumina Fine Jewelry!`;
      if (navigator.share) {
        navigator.share({ title: product.name, text }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text).then(() => {
          window.showToast('📋 Product info copied to clipboard!', 'success');
        });
      }
    });
  }

  document.getElementById('modal-add-cart').addEventListener('click', () => {
    if (activeProductId) {
      window.addToCart(activeProductId);
      document.getElementById('quick-view-modal').classList.remove('active');
      document.getElementById('cart-sidebar').classList.add('active');
      document.getElementById('cart-overlay').classList.add('active');
    }
  });

  document.getElementById('hold-btn').addEventListener('click', () => {
    if (!activeProductId) return;
    db.holdProduct(activeProductId);
    document.getElementById('hold-btn').textContent = '🔒 On Hold';
    document.getElementById('hold-btn').disabled = true;
    window.showToast('🔒 Piece reserved for 48 hours!', 'success');
    renderGallery();
  });

  document.getElementById('care-guide-btn').addEventListener('click', () => {
    document.getElementById('care-guide-modal').classList.add('active');
  });

  document.getElementById('write-review-btn').addEventListener('click', () => {
    document.getElementById('review-form-container').classList.toggle('hidden');
  });

  let selectedRating = 0;
  const stars = document.querySelectorAll('#review-stars .star');
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val);
      stars.forEach(s => s.classList.toggle('hover', parseInt(s.dataset.val) <= val));
    });
    star.addEventListener('mouseleave', () => stars.forEach(s => s.classList.remove('hover')));
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.val);
      stars.forEach(s => s.classList.toggle('filled', parseInt(s.dataset.val) <= selectedRating));
    });
  });

  document.getElementById('submit-review-btn').addEventListener('click', () => {
    const name = document.getElementById('review-name').value.trim();
    const text = document.getElementById('review-text').value.trim();
    if (!name || !text || !selectedRating) return window.showToast('Please fill all fields and select a rating.', 'warning');
    db.addReview(activeProductId, { name, text, rating: selectedRating });
    document.getElementById('review-name').value = '';
    document.getElementById('review-text').value = '';
    selectedRating = 0;
    stars.forEach(s => s.classList.remove('filled'));
    document.getElementById('review-form-container').classList.add('hidden');
    renderReviews(activeProductId);
    window.showToast('⭐ Review submitted! Thank you.', 'success');
  });
}

function renderReviews(productId) {
  const reviews = db.getReviews(productId);
  const container = document.getElementById('modal-reviews-list');
  if (!reviews.length) {
    container.innerHTML = '<p style="font-size:0.8rem; color:var(--text-muted);">No reviews yet. Be the first!</p>';
    return;
  }
  container.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-header"><span class="reviewer-name">${r.name}</span><span class="review-date">${r.date}</span></div>
      <div class="review-stars">${'★'.repeat(r.rating)}<span style="color:#ccc;">${'★'.repeat(5 - r.rating)}</span></div>
      <p class="review-text">${r.text}</p>
    </div>`).join('');
}

/* ==============================
   CERTIFICATE MODAL
============================== */
function initCertModal() {
  const certModal = document.getElementById('cert-modal');
  document.getElementById('close-cert').addEventListener('click', () => certModal.classList.remove('active'));
  document.getElementById('cert-btn').addEventListener('click', () => {
    const product = db.getProducts().find(p => p.id === activeProductId);
    if (!product) return;
    document.getElementById('cert-product-name').textContent = product.name;
    document.getElementById('cert-details').innerHTML = `Category: ${product.category}<br>Material: Handcrafted by Lumina artisans<br>Gemstones: Ethically sourced<br>Value: ${product.priceStr}`;
    document.getElementById('cert-serial').textContent = `Serial: LMN-${product.id.toString().padStart(3,'0')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
    certModal.classList.add('active');
  });
}

/* ==============================
   STATIC MODALS
============================== */
function initStaticModals() {
  [['close-care-guide','care-guide-modal'], ['close-returns','returns-modal'], ['close-shipping','shipping-modal']].forEach(([closeId, modalId]) => {
    const closeBtn = document.getElementById(closeId);
    if (closeBtn) closeBtn.addEventListener('click', () => document.getElementById(modalId).classList.remove('active'));
  });
}

/* ==============================
   BACK TO TOP
============================== */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ==============================
   CART
============================== */
window.addToCart = (productId) => {
  const product = db.getProducts().find(p => p.id === productId);
  if (product) {
    db.addToCart(product);
    updateCartDisplay();
    window.showToast(`🛒 "${product.name}" added to your bag!`, 'success');
  }
};
window.removeFromCart = (index) => {
  db.removeFromCart(index);
  updateCartDisplay();
  window.showToast('Item removed from your bag.', 'info');
};

function initCartUI() {
  const cartBtn = document.getElementById('cart-btn');
  const cartSidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  const checkoutBtn = document.getElementById('standard-checkout-btn');

  const openCart = () => { cartSidebar.classList.add('active'); overlay.classList.add('active'); updateCartDisplay(); };
  const closeCartFn = () => {
    cartSidebar.classList.remove('active');
    document.getElementById('wishlist-drawer')?.classList.remove('active');
    overlay.classList.remove('active');
  };

  cartBtn.addEventListener('click', openCart);
  document.getElementById('close-cart').addEventListener('click', closeCartFn);
  overlay.addEventListener('click', closeCartFn); // Only close panels, not modals

  const redeemBtn = document.getElementById('redeem-pts-btn');
  if (redeemBtn) {
    redeemBtn.addEventListener('click', () => {
      cartSidebar.classList.remove('active');
      document.getElementById('checkout-modal').classList.add('active');
      window.setCheckoutStep(1);
      updateGrandTotal();
      const pts = db.getLoyaltyPoints();
      const loyaltyRow = document.getElementById('loyalty-checkout-row');
      if (pts >= 100 && loyaltyRow) { loyaltyRow.classList.remove('hidden'); loyaltyRow.style.display = 'flex'; document.getElementById('loyalty-pts-checkout').textContent = pts; }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!db.getCart().length) return;
      cartSidebar.classList.remove('active');
      document.getElementById('checkout-modal').classList.add('active');
      window.setCheckoutStep(1);
      updateGrandTotal();
      const pts = db.getLoyaltyPoints();
      const loyaltyRow = document.getElementById('loyalty-checkout-row');
      if (pts >= 100 && loyaltyRow) {
        loyaltyRow.classList.remove('hidden'); loyaltyRow.style.display = 'flex';
        document.getElementById('loyalty-pts-checkout').textContent = pts;
      } else if (loyaltyRow) loyaltyRow.classList.add('hidden');
    });
  }

  updateCartDisplay();
  updateWishlistCount();
}

function updateCartDisplay() {
  const cart = db.getCart();
  const container = document.getElementById('cart-items-container');
  const countEl = document.getElementById('cart-count');
  const subtotalEl = document.getElementById('cart-subtotal');
  const checkoutBtn = document.getElementById('standard-checkout-btn');
  const loyaltyEl = document.getElementById('loyalty-display');
  const redeemBtn = document.getElementById('redeem-pts-btn');

  if (countEl) countEl.textContent = cart.length;
  const pts = db.getLoyaltyPoints();
  if (loyaltyEl) loyaltyEl.textContent = pts.toLocaleString();
  if (redeemBtn) redeemBtn.classList.toggle('hidden', pts < 100);

  if (!cart.length) {
    if (container) container.innerHTML = '<p class="empty-cart-msg">Your bag is empty.</p>';
    if (subtotalEl) subtotalEl.textContent = '$0';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }
  if (checkoutBtn) checkoutBtn.disabled = false;

  let subtotal = 0;
  if (container) {
    container.innerHTML = cart.map((item, i) => {
      subtotal += item.priceNum;
      return `<div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${item.priceStr}</div>
          <button class="remove-item" onclick="window.removeFromCart(${i})">Remove</button>
        </div>
      </div>`;
    }).join('');
  }
  if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toLocaleString();
}

function updateGrandTotal() {
  const cart = db.getCart();
  let subtotal = cart.reduce((acc, i) => acc + i.priceNum, 0);
  const giftWrap = document.getElementById('gift-wrap-check')?.checked ? 25 : 0;
  const loyaltyCheck = document.getElementById('loyalty-redeem-check')?.checked;
  if (loyaltyCheck && db.getLoyaltyPoints() >= 100) subtotal = Math.max(0, subtotal - 10);
  if (appliedPromo) {
    if (appliedPromo.type === 'percent') subtotal = subtotal * (1 - appliedPromo.discount / 100);
    else subtotal = Math.max(0, subtotal - appliedPromo.discount);
  }
  subtotal += giftWrap;
  const total = Math.round(subtotal);
  const el = document.getElementById('checkout-grand-total');
  if (el) el.textContent = '$' + total.toLocaleString();
  return total;
}

/* ==============================
   CHECKOUT
============================== */
function initCheckoutModal() {
  document.getElementById('close-checkout')?.addEventListener('click', () => document.getElementById('checkout-modal').classList.remove('active'));
  document.getElementById('close-success-btn')?.addEventListener('click', () => {
    document.getElementById('checkout-modal').classList.remove('active');
    document.getElementById('cart-overlay').classList.remove('active');
  });

  document.getElementById('gift-wrap-check').addEventListener('change', () => {
    document.getElementById('gift-note').classList.toggle('hidden', !document.getElementById('gift-wrap-check').checked);
    updateGrandTotal();
  });
  document.getElementById('loyalty-redeem-check')?.addEventListener('change', updateGrandTotal);

  document.getElementById('apply-promo-btn').addEventListener('click', () => {
    const code = document.getElementById('promo-input').value.trim();
    if (!code) return;
    const promo = db.validatePromoCode(code);
    const container = document.getElementById('promo-tag-container');
    if (promo) {
      appliedPromo = promo;
      const label = promo.type === 'percent' ? `${promo.discount}% off` : `$${promo.discount} off`;
      container.innerHTML = `<div class="promo-tag">✅ ${promo.code} — ${label} <button onclick="window.removePromo()">×</button></div>`;
      document.getElementById('promo-input').value = '';
      updateGrandTotal();
      window.showToast(`✅ Promo "${promo.code}" applied!`, 'success');
    } else {
      window.showToast('❌ Invalid promo code. Try LUMINA10, COASTAL20, or VIP50.', 'error');
    }
  });

  window.removePromo = () => {
    appliedPromo = null;
    document.getElementById('promo-tag-container').innerHTML = '';
    updateGrandTotal();
  };

  document.getElementById('payment-method').addEventListener('change', (e) => {
    document.getElementById('cc-details').classList.toggle('hidden', e.target.value !== 'cc');
  });

  window.setCheckoutStep = (step) => {
    document.getElementById('checkout-step-1').classList.toggle('hidden', step !== 1);
    document.getElementById('checkout-step-2').classList.toggle('hidden', step !== 2);
  };

  document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'Processing...';
    btn.disabled = true;

    setTimeout(() => {
      const cart = db.getCart();
      const total = updateGrandTotal();
      const giftWrap = document.getElementById('gift-wrap-check').checked;
      const loyaltyCheck = document.getElementById('loyalty-redeem-check')?.checked;
      if (loyaltyCheck && db.getLoyaltyPoints() >= 100) db.redeemLoyaltyPoints(100);
      db.addOrder(total, cart.length, giftWrap);
      db.clearCart();
      appliedPromo = null;
      updateCartDisplay();
      updateWishlistCount();
      window.setCheckoutStep(2);
      const earnedPts = Math.floor(total);
      const earnedMsg = document.getElementById('loyalty-earned-msg');
      if (earnedMsg) earnedMsg.textContent = `🏆 You earned ${earnedPts} loyalty points! Total: ${db.getLoyaltyPoints()} pts`;
      window.showToast('🎉 Order confirmed! Thank you for choosing Lumina.', 'success', 5000);
      btn.textContent = 'Place Order';
      btn.disabled = false;
      e.target.reset();
      document.getElementById('promo-tag-container').innerHTML = '';
      document.getElementById('gift-note').classList.add('hidden');
      document.getElementById('loyalty-checkout-row')?.classList.add('hidden');
      renderGallery();
    }, 1500);
  });
}

/* ==============================
   STYLE QUIZ
============================== */
function initStyleQuiz() {
  const modal = document.getElementById('style-quiz-modal');
  let currentStep = 1;
  const answers = {};

  document.getElementById('style-quiz-btn').addEventListener('click', () => { resetQuiz(); modal.classList.add('active'); });
  document.getElementById('close-quiz').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('retake-quiz-btn').addEventListener('click', resetQuiz);

  const showStep = (step) => {
    currentStep = step;
    document.querySelectorAll('.quiz-step').forEach((s, i) => s.classList.toggle('active', i + 1 === step));
    document.querySelectorAll('.quiz-dot').forEach((d, i) => d.classList.toggle('active', i < step));
  };

  function resetQuiz() {
    Object.keys(answers).forEach(k => delete answers[k]);
    document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    showStep(1);
  }

  document.querySelectorAll('.quiz-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const step = currentStep;
      answers[step] = opt.dataset.val;
      opt.closest('.quiz-options').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      setTimeout(() => { if (step < 3) showStep(step + 1); else buildResults(answers); }, 300);
    });
  });

  function buildResults(answers) {
    showStep(4);
    const products = db.getProducts();
    const maxPrice = parseFloat(answers[3]) || Infinity;
    const category = answers[2];
    let matches = products.filter(p => p.priceNum <= maxPrice && (!category || p.category === category)).slice(0, 3);
    if (!matches.length) matches = products.slice(0, 3);
    document.getElementById('quiz-results').innerHTML = matches.map(p => `
      <div class="quiz-result-card" onclick="window.openQuickView(${p.id}); document.getElementById('style-quiz-modal').classList.remove('active');">
        <img src="${p.image}" alt="${p.name}">
        <div class="quiz-result-info">
          <h4>${p.name}</h4>
          <p>${p.description.substring(0, 60)}...</p>
          <p class="price">${p.priceStr}</p>
        </div>
      </div>`).join('');
  }
}

/* ==============================
   CUSTOM ORDER WIZARD
============================== */
function initCustomOrderWizard() {
  const modal = document.getElementById('custom-order-modal');
  const sel = {};

  document.getElementById('custom-order-btn')?.addEventListener('click', () => { resetCw(); modal.classList.add('active'); });
  document.getElementById('close-custom-order').addEventListener('click', () => modal.classList.remove('active'));
  document.getElementById('cw-close-final').addEventListener('click', () => modal.classList.remove('active'));

  const showCwStep = (step) => modal.querySelectorAll('.custom-wizard-step').forEach((s, i) => s.classList.toggle('active', i + 1 === step));

  function resetCw() {
    Object.keys(sel).forEach(k => delete sel[k]);
    modal.querySelectorAll('.wizard-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('cw-budget').value = '';
    document.getElementById('cw-notes').value = '';
    showCwStep(1);
  }

  modal.querySelectorAll('.wizard-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.dataset.group;
      modal.querySelectorAll(`.wizard-chip[data-group="${group}"]`).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      sel[group] = chip.dataset.val;
    });
  });

  document.getElementById('cw-next-1').addEventListener('click', () => { if (!sel.metal) return window.showToast('Please select a metal.', 'warning'); showCwStep(2); });
  document.getElementById('cw-back-2').addEventListener('click', () => showCwStep(1));
  document.getElementById('cw-next-2').addEventListener('click', () => { if (!sel.stone) return window.showToast('Please select a stone.', 'warning'); showCwStep(3); });
  document.getElementById('cw-back-3').addEventListener('click', () => showCwStep(2));

  document.getElementById('cw-submit').addEventListener('click', async () => {
    if (!sel.type) return window.showToast('Please select a piece type.', 'warning');
    sel.budget = document.getElementById('cw-budget').value || 'flexible';
    sel.notes = document.getElementById('cw-notes').value || 'No additional notes.';
    db.addInquiry({ ...sel });
    showCwStep(4);
    const el = document.getElementById('cw-ai-response');
    el.textContent = 'Our artisan is reviewing your request...';
    try {
      const text = await callPollinationsForCustomOrder(sel);
      el.innerHTML = text.replace(/\n/g, '<br/>');
    } catch {
      el.textContent = `Thank you! Our master jewelers will reach out within 24 hours to discuss your ${sel.type} in ${sel.metal} with ${sel.stone}. Budget noted: $${sel.budget}.`;
    }
    window.showToast('✉️ Commission request submitted!', 'success');
  });
}

async function callPollinationsForCustomOrder(sel) {
  const res = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [
      { role: 'system', content: 'You are a warm, knowledgeable concierge for Lumina, Veronica Garza\'s handcrafted jewelry brand based in Ventura, California. Veronica is a master jeweler with a lifetime of gem shows, artisan craft, and California coastal living behind her work. Write with warmth, authenticity, and quiet confidence.' },
      { role: 'user', content: `Write a warm, luxurious 3-sentence confirmation for a custom ${sel.type} in ${sel.metal} with ${sel.stone}. Budget: $${sel.budget}. Notes: "${sel.notes}". Sign as "The Lumina Artisan Team".` }
    ]})
  });
  return res.text();
}

/* ==============================
   NEWSLETTER
============================== */
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value;
    window.showToast(`📬 Welcome to the Inner Circle! We'll be in touch at ${email}`, 'success', 5000);
    form.reset();
  });
}

/* ==============================
   FOOTER LINKS
============================== */
function initFooterLinks() {
  const links = {
    'footer-custom-order': () => document.getElementById('custom-order-modal').classList.add('active'),
    'footer-quiz': () => document.getElementById('style-quiz-modal').classList.add('active'),
    'footer-care-guide': () => document.getElementById('care-guide-modal').classList.add('active'),
    'footer-returns': () => document.getElementById('returns-modal').classList.add('active'),
    'footer-shipping': () => document.getElementById('shipping-modal').classList.add('active'),
    'footer-agent': () => document.getElementById('ai-panel').classList.add('active'),
    'footer-privacy': () => window.showToast('Privacy Policy: We never share or sell your data.', 'info', 4000),
    'footer-terms': () => window.showToast('Terms: All sales final on custom commission pieces.', 'info', 4000)
  };
  Object.entries(links).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', (e) => { e.preventDefault(); fn(); });
  });
}
