// ==============================
// main.js - Shared utilities used across all pages
// ==============================

const API_BASE = '/api';

// ------------------------------
// Local storage helpers (auth)
// ------------------------------
const Auth = {
  getToken: () => localStorage.getItem('token'),
  getUser: () => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  setSession: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  isLoggedIn: () => !!localStorage.getItem('token'),
  isAdmin: () => {
    const user = Auth.getUser();
    return user && user.role === 'admin';
  },
};

// ------------------------------
// Fetch wrapper - attaches JWT and handles JSON automatically
// ------------------------------
async function apiRequest(endpoint, { method = 'GET', body = null, isForm = false } = {}) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = isForm ? body : JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, options);
  } catch (err) {
    throw new Error('Network error - please check your connection and that the server is running.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

// ------------------------------
// Toast Notifications
// ------------------------------
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ------------------------------
// Confirmation Dialog (simple wrapper around confirm())
// ------------------------------
function confirmAction(message) {
  return window.confirm(message);
}

// ------------------------------
// Format currency (INR)
// ------------------------------
function formatPrice(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

// ------------------------------
// Star rating renderer (returns HTML string)
// ------------------------------
function renderStars(rating) {
  const rounded = Math.round(rating || 0);
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= rounded ? '★' : '☆';
  }
  return html;
}

// ------------------------------
// Cart / Wishlist count badges (fetched on every page load if logged in)
// ------------------------------
async function updateNavBadges() {
  const cartBadge = document.getElementById('cart-count');
  const wishlistBadge = document.getElementById('wishlist-count');
  if (!Auth.isLoggedIn()) return;

  try {
    const cartData = await apiRequest('/cart');
    if (cartBadge) {
      const count = cartData.cart.items.reduce((sum, i) => sum + i.quantity, 0);
      cartBadge.textContent = count > 0 ? count : '';
    }
  } catch { /* ignore - user might not be logged in yet */ }

  try {
    const wishlistData = await apiRequest('/wishlist');
    if (wishlistBadge) {
      wishlistBadge.textContent = wishlistData.wishlist.products.length || '';
    }
  } catch { /* ignore */ }
}

// ------------------------------
// Render shared Navbar + Categories bar
// Every page includes a <div id="navbar-root"></div>
// ------------------------------
async function renderNavbar() {
  const root = document.getElementById('navbar-root');
  if (!root) return;

  const user = Auth.getUser();
  const loggedIn = Auth.isLoggedIn();

  root.innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
       <a href="/" class="logo">NM<span>Store</span></a>
        <form class="search-bar" id="navbar-search-form">
          <input type="text" id="navbar-search-input" placeholder="Search for products..." />
          <button type="submit">🔍</button>
        </form>
        <div class="nav-links">
          ${loggedIn ? `
            <a href="/wishlist">♥ Wishlist<span class="badge" id="wishlist-count"></span></a>
            <a href="/cart">🛒 Cart<span class="badge" id="cart-count"></span></a>
            <a href="/orders">📦 Orders</a>
            <a href="/profile">👤 ${user ? user.name.split(' ')[0] : 'Profile'}</a>
            ${user && user.role === 'admin' ? '<a href="/admin">⚙ Admin</a>' : ''}
            <a href="#" id="logout-link">Logout</a>
          ` : `
            <a href="/login">Login</a>
            <a href="/register">Register</a>
          `}
        </div>
      </div>
    </nav>
    <div class="categories-bar">
      <div class="container" id="navbar-categories">Loading categories...</div>
    </div>
  `;

  document.getElementById('navbar-search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('navbar-search-input').value.trim();
    window.location.href = `/products${q ? `?search=${encodeURIComponent(q)}` : ''}`;
  });

  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await apiRequest('/auth/logout', { method: 'POST' }); } catch {}
      Auth.clearSession();
      showToast('Logged out successfully', 'success');
      setTimeout(() => (window.location.href = '/'), 600);
    });
  }

  // Load categories into the categories bar
  try {
    const { categories } = await apiRequest('/categories');
    const catContainer = document.getElementById('navbar-categories');
    catContainer.innerHTML = categories
      .map((c) => `<a href="/products?category=${c._id}">${c.name}</a>`)
      .join('');
  } catch {
    document.getElementById('navbar-categories').innerHTML = '';
  }

  updateNavBadges();
}

// ------------------------------
// Render shared Footer
// Every page includes a <div id="footer-root"></div>
// ------------------------------
function renderFooter() {
  const root = document.getElementById('footer-root');
  if (!root) return;

  root.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
           <h4>NM Store</h4>
            <p style="font-size:13.5px; color:#9ca3af;">Your one-stop shop for everyday essentials, delivered fast.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <a href="/products">All Products</a>
            <a href="/products?featured=true">Featured</a>
            <a href="/products?sort=newest">New Arrivals</a>
          </div>
          <div>
            <h4>Account</h4>
            <a href="/profile">My Profile</a>
            <a href="/orders">My Orders</a>
            <a href="/wishlist">Wishlist</a>
          </div>
          <div>
            <h4>Newsletter</h4>
            <p style="font-size:13px; color:#9ca3af;">Get updates on offers & new products.</p>
            <div class="newsletter">
              <input type="email" id="newsletter-email" placeholder="Your email" />
              <button class="btn btn-secondary btn-sm" id="newsletter-btn">Join</button>
            </div>
          </div>
        </div>
        <div class="footer-bottom">&copy; ${new Date().getFullYear()} NM Store. All rights reserved.</div>
      </div>
    </footer>
  `;

  const btn = document.getElementById('newsletter-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const email = document.getElementById('newsletter-email').value.trim();
      if (!email) return showToast('Please enter an email address', 'error');
      showToast('Thanks for subscribing!', 'success');
      document.getElementById('newsletter-email').value = '';
    });
  }
}

// ------------------------------
// Guard helpers for protected pages
// ------------------------------
function requireLogin() {
  if (!Auth.isLoggedIn()) {
    showToast('Please log in to continue', 'error');
    setTimeout(() => (window.location.href = '/login'), 800);
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    showToast('Admin access required', 'error');
    setTimeout(() => (window.location.href = '/'), 800);
    return false;
  }
  return true;
}

// Auto-render navbar & footer on every page load
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
});
