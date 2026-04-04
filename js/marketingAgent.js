import { db } from './db.js';
import { initDarkMode } from './darkMode.js';

document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();

  // --- TAB NAVIGATION ---
  const tabs = document.querySelectorAll('.admin-tab');
  const sections = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.add('hidden'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-target');
      document.getElementById(targetId)?.classList.remove('hidden');

      switch (targetId) {
        case 'overview-view': renderDashboard(); break;
        case 'promos-view': renderPromoList(); break;
        case 'inquiries-view': renderInquiries(); break;
        case 'inventory-view': renderInventoryTable(); break;
      }
    });
  });

  // --- DASHBOARD OVERVIEW ---
  function renderDashboard() {
    const orders = db.getOrders();
    const revEl = document.getElementById('metric-revenue');
    const ordEl = document.getElementById('metric-orders');
    const avgEl = document.getElementById('metric-avg');
    const loyaltyEl = document.getElementById('metric-loyalty');
    const inquiryEl = document.getElementById('metric-inquiries');

    const totalRev = orders.reduce((acc, o) => acc + o.total, 0);
    const avg = orders.length ? Math.round(totalRev / orders.length) : 0;

    if (revEl) revEl.textContent = '$' + totalRev.toLocaleString();
    if (ordEl) ordEl.textContent = orders.length;
    if (avgEl) avgEl.textContent = '$' + avg.toLocaleString();
    if (loyaltyEl) loyaltyEl.textContent = db.getLoyaltyPoints().toLocaleString() + ' pts';
    if (inquiryEl) inquiryEl.textContent = db.getInquiries().filter(i => i.status === 'New').length;

    drawRevenueChart(orders);
  }
  renderDashboard();

  function drawRevenueChart(orders) {
    const svg = document.getElementById('revenue-chart');
    const noMsg = document.getElementById('no-chart-msg');
    if (!orders.length) {
      if (svg) svg.style.display = 'none';
      if (noMsg) noMsg.style.display = '';
      return;
    }
    if (noMsg) noMsg.style.display = 'none';
    if (!svg) return;
    svg.style.display = 'block';

    const W = Math.max(svg.clientWidth || 0, 600);
    const H = 220;
    const PAD = { top: 24, right: 20, bottom: 44, left: 64 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    const maxVal = Math.max(...orders.map(o => o.total)) * 1.2 || 1000;
    const barW = Math.min(52, chartW / (orders.length || 1) - 10);

    let inner = '';
    // Grid lines + Y labels
    [0, 0.25, 0.5, 0.75, 1].forEach(frac => {
      const val = Math.round(maxVal * frac);
      const y = PAD.top + chartH - frac * chartH;
      inner += `<line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}" stroke="var(--border-light)" stroke-width="1"/>
                <text x="${PAD.left - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--text-muted)">$${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}</text>`;
    });

    orders.forEach((order, i) => {
      const barH = Math.max(4, (order.total / maxVal) * chartH);
      const x = PAD.left + (i / orders.length) * chartW + (chartW / orders.length - barW) / 2;
      const y = PAD.top + chartH - barH;
      const date = new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const giftIcon = order.giftWrap ? '🎁 ' : '';

      inner += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="var(--coastal-blue)" opacity="0.8"/>
                <text x="${x + barW/2}" y="${y - 6}" text-anchor="middle" font-size="10" fill="var(--text-dark)">$${(order.total/1000).toFixed(1)}k</text>
                <text x="${x + barW/2}" y="${H - 10}" text-anchor="middle" font-size="9" fill="var(--text-muted)">${giftIcon}${date}</text>`;
    });

    svg.innerHTML = inner;
  }

  // --- MARKETING COPY GENERATOR ---
  const productSelect = document.getElementById('product-select');
  const genForm = document.getElementById('marketing-form');
  const genBtn = document.getElementById('generate-btn');
  const outputLoading = document.getElementById('output-loading');
  const outputContent = document.getElementById('output-content');
  const copyBtn = document.getElementById('copy-btn');

  function populateProductSelect() {
    if (!productSelect) return;
    const products = db.getProducts();
    productSelect.innerHTML = '<option value="" disabled selected>Select a product</option>';
    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      productSelect.appendChild(opt);
    });
  }
  populateProductSelect();

  genForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = productSelect.value;
    const goal = document.getElementById('campaign-goal').value;
    const product = db.getProducts().find(p => p.id == productId);
    if (!product) return;

    outputContent?.classList.add('hidden');
    copyBtn?.classList.add('hidden');
    outputLoading?.classList.remove('hidden');
    if (genBtn) genBtn.disabled = true;

    try {
      const text = await callPollinationsMarketing(product, goal);
      if (outputLoading) outputLoading.classList.add('hidden');
      if (outputContent) { outputContent.classList.remove('hidden', 'text-muted'); outputContent.textContent = text; }
      copyBtn?.classList.remove('hidden');
    } catch (err) {
      if (outputLoading) outputLoading.classList.add('hidden');
      if (outputContent) { outputContent.classList.remove('hidden'); outputContent.textContent = 'API Error: ' + err.message; }
    } finally {
      if (genBtn) genBtn.disabled = false;
    }
  });

  copyBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(outputContent.textContent).then(() => {
      const orig = copyBtn.textContent;
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => { copyBtn.textContent = orig; }, 2000);
    });
  });

  async function callPollinationsMarketing(product, goal) {
    const sys = 'You are Lumina\'s luxury Marketing Copywriter. Brand tone: desert warmth meets coastal elegance, Santa Fe meets Santa Barbara. Writing is poetic yet precise.';
    const prompt = `Write high-converting marketing copy for: "${product.name}" (Category: ${product.category}, Price: ${product.priceStr}). Description: "${product.description}". Format: ${goal}. Include all relevant details for the chosen format (e.g. hashtags for Instagram, subject line for email, etc.).`;
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }] })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return res.text();
  }

  // --- INVENTORY ---
  function renderInventoryTable() {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    const products = db.getProducts();
    tableBody.innerHTML = products.map(p => {
      const stock = p.stock !== undefined ? p.stock : 5;
      const stockColor = stock <= 2 ? '#c62828' : stock <= 5 ? '#e65100' : 'var(--text-dark)';
      return `<tr style="border-bottom:1px solid var(--border-light);">
        <td style="padding:12px;"><img src="${p.image}" alt="${p.name}" style="width:44px;height:44px;object-fit:cover;border-radius:4px;"></td>
        <td style="padding:12px; font-weight:500;">${p.name}</td>
        <td style="padding:12px; color:var(--text-muted);">${p.category}</td>
        <td style="padding:12px; color:var(--terracotta);">${p.priceStr}</td>
        <td style="padding:12px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-weight:600; color:${stockColor};">${stock}</span>
            <input type="number" min="0" max="999" value="${stock}" style="width:60px; padding:4px 6px; border:1px solid var(--border-light); border-radius:4px; font-size:0.85rem; background:var(--crisp-white); color:var(--text-dark);"
              onchange="window.updateStock(${p.id}, this.value)">
          </div>
        </td>
      </tr>`;
    }).join('');
  }
  renderInventoryTable();

  window.updateStock = (productId, newVal) => {
    db.updateProductStock(productId, parseInt(newVal) || 0);
  };

  document.getElementById('open-add-product-modal')?.addEventListener('click', () => {
    document.getElementById('add-product-modal').classList.add('active');
  });
  document.getElementById('close-add-product')?.addEventListener('click', () => {
    document.getElementById('add-product-modal').classList.remove('active');
  });

  document.getElementById('add-product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const priceNum = parseInt(document.getElementById('new-prod-price').value);
    db.addProduct({
      name: document.getElementById('new-prod-name').value,
      category: document.getElementById('new-prod-category').value,
      priceNum,
      priceStr: `$${priceNum.toLocaleString()}`,
      image: document.getElementById('new-prod-image').value,
      description: document.getElementById('new-prod-desc').value,
      stock: parseInt(document.getElementById('new-prod-stock').value) || 5
    });
    renderInventoryTable();
    populateProductSelect();
    document.getElementById('add-product-modal').classList.remove('active');
    e.target.reset();
  });

  // --- PROMO CODES ---
  function renderPromoList() {
    const codes = db.getPromoCodes();
    const container = document.getElementById('promo-list');
    if (!container) return;
    if (!codes.length) { container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No active codes.</p>'; return; }
    container.innerHTML = codes.map(c => {
      const label = c.type === 'percent' ? `${c.discount}% off` : `$${c.discount} off`;
      return `<div class="promo-admin-row">
        <span class="promo-code-badge">${c.code}</span>
        <span style="color:var(--text-muted);">${label}</span>
        <button onclick="window.deletePromo('${c.code}')" style="background:none; border:1px solid #f44336; color:#f44336; border-radius:4px; padding:2px 10px; cursor:pointer; font-size:0.8rem;">Delete</button>
      </div>`;
    }).join('');
  }

  window.deletePromo = (code) => { db.removePromoCode(code); renderPromoList(); };

  document.getElementById('promo-create-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('new-code-str').value.trim().toUpperCase();
    const type = document.getElementById('new-code-type').value;
    const discount = parseInt(document.getElementById('new-code-value').value);
    if (!code || !discount) return;
    db.addPromoCode({ code, type, discount });
    renderPromoList();
    e.target.reset();
  });

  // --- INQUIRIES ---
  function renderInquiries() {
    const container = document.getElementById('inquiries-list');
    if (!container) return;
    const inquiries = db.getInquiries();
    if (!inquiries.length) {
      container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:var(--space-8);">No commission inquiries yet. They will appear here when customers submit a custom order request.</p>';
      return;
    }
    container.innerHTML = inquiries.map((inq, idx) => {
      const date = new Date(inq.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const statusColor = inq.status === 'New' ? '#2e7d32' : 'var(--text-muted)';
      return `<div style="border:1px solid var(--border-light); border-radius:8px; padding:var(--space-4); margin-bottom:var(--space-4);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-3);">
          <span style="font-weight:600; font-size:0.9rem;">Commission Request #${inquiries.length - idx}</span>
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <span style="background:${inq.status==='New'?'#e8f5e9':'var(--soft-cloud)'}; color:${statusColor}; font-size:0.75rem; font-weight:700; padding:2px 10px; border-radius:20px;">${inq.status}</span>
            ${inq.status === 'New' ? `<button onclick="window.markReplied(${idx})" style="background:none; border:1px solid var(--coastal-blue); color:var(--coastal-blue); border-radius:4px; padding:2px 10px; cursor:pointer; font-size:0.8rem;">Mark Replied</button>` : ''}
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:var(--space-3); font-size:0.85rem; color:var(--text-dark);">
          <div><span style="color:var(--text-muted); display:block; font-size:0.75rem;">Piece Type</span>${inq.type || '—'}</div>
          <div><span style="color:var(--text-muted); display:block; font-size:0.75rem;">Metal</span>${inq.metal || '—'}</div>
          <div><span style="color:var(--text-muted); display:block; font-size:0.75rem;">Stone</span>${inq.stone || '—'}</div>
          <div><span style="color:var(--text-muted); display:block; font-size:0.75rem;">Budget</span>$${inq.budget || '—'}</div>
        </div>
        ${inq.notes && inq.notes !== 'No additional notes.' ? `<p style="margin-top:var(--space-3); font-size:0.85rem; color:var(--text-muted); font-style:italic;">"${inq.notes}"</p>` : ''}
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:var(--space-3);">${date}</p>
      </div>`;
    }).join('');
  }

  window.markReplied = (idx) => {
    db.updateInquiryStatus(idx, 'Replied');
    renderInquiries();
    renderDashboard();
  };

  // --- EMAIL BLAST COMPOSER ---
  const emailForm = document.getElementById('email-compose-form');
  const emailLoading = document.getElementById('email-loading');
  const emailOutput = document.getElementById('email-output');
  const copyEmailBtn = document.getElementById('copy-email-btn');

  emailForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('email-subject').value || 'A Message from Lumina';
    const occasion = document.getElementById('email-occasion').value;
    const notes = document.getElementById('email-notes').value;

    emailOutput?.classList.add('hidden');
    emailLoading?.classList.remove('hidden');
    copyEmailBtn?.classList.add('hidden');
    const composeBtn = document.getElementById('compose-btn');
    if (composeBtn) composeBtn.disabled = true;

    const products = db.getProducts().slice(0, 3).map(p => `${p.name} (${p.priceStr})`).join(', ');

    try {
      const text = await callPollinationsEmail(subject, occasion, notes, products);
      if (emailLoading) emailLoading.classList.add('hidden');
      if (emailOutput) { emailOutput.classList.remove('hidden', 'text-muted'); emailOutput.textContent = text; }
      copyEmailBtn?.classList.remove('hidden');
    } catch (err) {
      if (emailLoading) emailLoading.classList.add('hidden');
      if (emailOutput) { emailOutput.classList.remove('hidden'); emailOutput.textContent = 'Error: ' + err.message; }
    } finally {
      if (composeBtn) composeBtn.disabled = false;
    }
  });

  copyEmailBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(emailOutput.textContent).then(() => {
      const orig = copyEmailBtn.textContent;
      copyEmailBtn.textContent = '✓ Copied!';
      setTimeout(() => { copyEmailBtn.textContent = orig; }, 2000);
    });
  });

  async function callPollinationsEmail(subject, occasion, notes, products) {
    const sys = 'You are Lumina\'s luxury email marketer. Brand: desert-meets-coastal jewelry. Santa Fe art tradition + Santa Barbara coastal elegance. Write beautiful, compelling HTML-free email copy.';
    const prompt = `Write a complete email marketing campaign with the following details:
Subject Line: "${subject}"
Occasion: ${occasion}
Featured products to mention: ${products}
Additional notes: ${notes || 'None'}

Structure it as:
1. Preheader text (1 line)
2. Opening greeting  
3. Main body (2-3 compelling paragraphs)
4. Product spotlight section
5. Call to Action
6. Warm sign-off from Elena Vásquez, Master Jeweler

Keep it under 350 words total. Luxurious, evocative, never salesy.`;

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: sys }, { role: 'user', content: prompt }] })
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return res.text();
  }

});
