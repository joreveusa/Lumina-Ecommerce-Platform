/**
 * Lumina Toast Notification System
 * Usage: window.showToast('Added to cart!', 'success')
 * Types: 'success' | 'error' | 'info' | 'warning'
 */
export function initToast() {
  // Expose globally so HTML onclick attrs and other modules can call it
  window.showToast = showToast;
}

function showToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '•'}</span><span class="toast-msg">${message}</span>`;

  container.appendChild(toast);

  // Double rAF ensures class is added after element is in DOM
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}
