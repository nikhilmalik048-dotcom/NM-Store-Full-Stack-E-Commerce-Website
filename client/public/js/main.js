// =====================================================
// NM STORE - Shared utilities and premium site interactions
// =====================================================

const API_BASE = '/api';

// =====================================================
// AUTHENTICATION / SESSION
// =====================================================

const Auth = {
  getToken: () => localStorage.getItem('token'),

  getUser: () => {
    const raw = localStorage.getItem('user');

    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
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
    return !!(user && user.role === 'admin');
  },
};

// =====================================================
// API REQUEST HELPER
// =====================================================

async function apiRequest(
  endpoint,
  { method = 'GET', body = null, isForm = false } = {}
) {
  const headers = {};
  const token = Auth.getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isForm) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
  };

  if (body !== null && body !== undefined) {
    options.body = isForm ? body : JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, options);
  } catch {
    throw new Error(
      'Network error - please check your connection and that the server is running.'
    );
  }

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`
    );
  }

  return data;
}

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');

  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');

    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3500);
}

// =====================================================
// CONFIRMATION
// =====================================================

function confirmAction(message) {
  return window.confirm(message);
}

// =====================================================
// FORMAT HELPERS
// =====================================================

function formatPrice(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

function renderStars(rating) {
  const rounded = Math.max(
    0,
    Math.min(5, Math.round(Number(rating) || 0))
  );

  let html = '';

  for (let i = 1; i <= 5; i++) {
    html += i <= rounded ? '★' : '☆';
  }

  return html;
}

function escapeHtml(str) {
  if (str === null || str === undefined) {
    return '';
  }

  const div = document.createElement('div');

  div.textContent = String(str);

  return div.innerHTML;
}

// =====================================================
// NAVIGATION BADGES
// =====================================================

function setBadge(id, count) {
  const badge = document.getElementById(id);

  if (!badge) {
    return;
  }

  const value = Number(count) || 0;

  badge.textContent = value > 0 ? value : '';

  badge.classList.toggle(
    'visible',
    value > 0
  );

  if (value > 0) {
    badge.classList.remove('badge-pop');

    requestAnimationFrame(() => {
      badge.classList.add('badge-pop');
    });

    setTimeout(() => {
      badge.classList.remove('badge-pop');
    }, 350);
  }
}

async function updateNavBadges() {
  if (!Auth.isLoggedIn()) {
    setBadge('cart-count', 0);
    setBadge('wishlist-count', 0);
    return;
  }

  // Cart
  try {
    const cartData = await apiRequest('/cart');

    const items =
      cartData.cart?.items || [];

    const count = items.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );

    setBadge('cart-count', count);
  } catch (error) {
    console.debug(
      'Cart badge update skipped:',
      error.message
    );
  }

  // Wishlist
  try {
    const wishlistData =
      await apiRequest('/wishlist');

    const products =
      wishlistData.wishlist?.products || [];

    setBadge(
      'wishlist-count',
      products.length
    );
  } catch (error) {
    console.debug(
      'Wishlist badge update skipped:',
      error.message
    );
  }
}

// =====================================================
// AMAZON-STYLE LIVE SEARCH
// =====================================================

let searchSuggestionTimer = null;

let searchRequestId = 0;

// =====================================================
// CREATE SEARCH BOX
// =====================================================

function createSearchSuggestionBox() {
  let box =
    document.getElementById(
      'search-suggestions'
    );

  if (box) {
    return box;
  }

  box = document.createElement('div');

  box.id = 'search-suggestions';

  box.className =
    'search-suggestions';

  box.style.display = 'none';

  box.setAttribute(
    'role',
    'listbox'
  );

  const searchBar =
    document.querySelector(
      '.search-bar'
    );

  if (searchBar) {
    searchBar.style.position =
      'relative';

    searchBar.appendChild(box);
  }

  return box;
}

// =====================================================
// HIDE SEARCH
// =====================================================

function hideSearchSuggestions() {
  const box =
    document.getElementById(
      'search-suggestions'
    );

  if (!box) {
    return;
  }

  box.style.display = 'none';
}

// =====================================================
// CLEAR SEARCH
// =====================================================

function clearSearchSuggestions() {
  const box =
    document.getElementById(
      'search-suggestions'
    );

  if (!box) {
    return;
  }

  box.innerHTML = '';

  box.style.display = 'none';
}

// =====================================================
// SHOW LIVE SEARCH SUGGESTIONS
// =====================================================

async function showSearchSuggestions(query) {
  const box =
    document.getElementById(
      'search-suggestions'
    );

  if (!box) {
    return;
  }

  query = query.trim();

  if (query.length < 2) {
    clearSearchSuggestions();
    return;
  }

  const requestId =
    ++searchRequestId;

  try {
    const data =
      await apiRequest(
        `/products?search=${encodeURIComponent(
          query
        )}&limit=8&page=1`
      );

    // Ignore old API response
    if (
      requestId !==
      searchRequestId
    ) {
      return;
    }

    const products =
      data.products || [];

    // No products
    if (!products.length) {
      box.innerHTML = `
        <div class="search-no-results">
          <span class="search-empty-icon">
            ⌕
          </span>

          <div>
            No products found for
            <strong>
              ${escapeHtml(query)}
            </strong>
          </div>
        </div>
      `;

      box.style.display =
        'block';

      return;
    }

    // Products
    box.innerHTML =
      products
        .map((product) => {
          const image =
            product.images &&
            product.images.length
              ? product.images[0]
              : 'https://placehold.co/60x60?text=No+Image';

          const price =
            product.discountPrice >
            0
              ? product.discountPrice
              : product.price;

          const categoryName =
            product.category?.name ||
            '';

          return `
            <a
              class="search-suggestion-item"
              href="/product-detail?id=${encodeURIComponent(
                product._id
              )}"
              data-product-id="${escapeHtml(
                product._id
              )}"
              role="option"
            >

              <div class="search-suggestion-image">

                <img
                  src="${escapeHtml(image)}"
                  alt="${escapeHtml(
                    product.name
                  )}"
                  loading="lazy"
                  onerror="this.src='https://placehold.co/60x60?text=No+Image'"
                />

              </div>

              <div class="search-suggestion-info">

                <div class="search-suggestion-name">
                  ${escapeHtml(
                    product.name
                  )}
                </div>

                ${
                  categoryName
                    ? `
                      <div class="search-suggestion-category">
                        ${escapeHtml(
                          categoryName
                        )}
                      </div>
                    `
                    : ''
                }

                <div class="search-suggestion-price">
                  ${formatPrice(price)}
                </div>

              </div>

              <span class="search-suggestion-arrow">
                →
              </span>

            </a>
          `;
        })
        .join('');

    // See all results
    box.innerHTML += `
      <a
        class="search-see-all"
        href="/products?search=${encodeURIComponent(
          query
        )}"
      >

        <span>⌕</span>

        <span>
          See all results for
          <strong>
            ${escapeHtml(query)}
          </strong>
        </span>

        <span>→</span>

      </a>
    `;

    box.style.display =
      'block';
  } catch (error) {
    if (
      requestId !==
      searchRequestId
    ) {
      return;
    }

    console.error(
      'Search suggestions error:',
      error
    );

    box.innerHTML = `
      <div class="search-no-results">
        Unable to load suggestions
      </div>
    `;

    box.style.display =
      'block';
  }
}

// =====================================================
// SETUP LIVE SEARCH
// =====================================================

function setupLiveSearch() {
  const input =
    document.getElementById(
      'navbar-search-input'
    );

  const form =
    document.getElementById(
      'navbar-search-form'
    );

  if (!input || !form) {
    return;
  }

  // Prevent duplicate listeners
  if (
    form.dataset.searchReady ===
    'true'
  ) {
    return;
  }

  form.dataset.searchReady =
    'true';

  const box =
    createSearchSuggestionBox();

  // ===================================================
  // TYPING
  // ===================================================

  input.addEventListener(
    'input',
    () => {
      clearTimeout(
        searchSuggestionTimer
      );

      const query =
        input.value.trim();

      if (query.length < 2) {
        clearSearchSuggestions();
        return;
      }

      searchSuggestionTimer =
        setTimeout(() => {
          showSearchSuggestions(
            query
          );
        }, 300);
    }
  );

  // ===================================================
  // FOCUS
  // ===================================================

  input.addEventListener(
    'focus',
    () => {
      const query =
        input.value.trim();

      if (query.length >= 2) {
        showSearchSuggestions(
          query
        );
      }
    }
  );

  // ===================================================
  // SUBMIT
  // ===================================================

  form.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();

      clearTimeout(
        searchSuggestionTimer
      );

      const query =
        input.value.trim();

      hideSearchSuggestions();

      window.location.href =
        `/products${
          query
            ? `?search=${encodeURIComponent(
                query
              )}`
            : ''
        }`;
    }
  );

  // ===================================================
  // KEYBOARD
  // ===================================================

  input.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key ===
        'Escape'
      ) {
        hideSearchSuggestions();

        input.blur();
      }

      if (
        event.key ===
        'Enter'
      ) {
        hideSearchSuggestions();
      }
    }
  );

  // ===================================================
  // CLICK OUTSIDE
  // ===================================================

  if (
    !document.body.dataset
      .searchOutsideReady
  ) {
    document.body.dataset
      .searchOutsideReady =
      'true';

    document.addEventListener(
      'click',
      (event) => {
        const currentForm =
          document.getElementById(
            'navbar-search-form'
          );

        const currentBox =
          document.getElementById(
            'search-suggestions'
          );

        if (
          currentForm &&
          currentBox &&
          !currentForm.contains(
            event.target
          )
        ) {
          currentBox.style.display =
            'none';
        }
      }
    );
  }
}

// =====================================================
// CATEGORY NAVIGATION
// =====================================================

function renderCategoryLinks(
  categories
) {
  const container =
    document.getElementById(
      'navbar-categories'
    );

  if (!container) {
    return;
  }

  if (!categories.length) {
    container.innerHTML = `
      <span class="category-empty">
        No categories available
      </span>
    `;

    return;
  }

  container.innerHTML = `
    <a
      class="category-all"
      href="/products"
    >
      <span>☰</span>
      All
    </a>

    ${categories
      .map(
        (category) => `
          <a
            href="/products?category=${encodeURIComponent(
              category._id
            )}"
            title="${escapeHtml(
              category.name
            )}"
          >
            ${escapeHtml(
              category.name
            )}
          </a>
        `
      )
      .join('')}
  `;
}

// =====================================================
// RENDER NAVBAR
// =====================================================

async function renderNavbar() {
  const root =
    document.getElementById(
      'navbar-root'
    );

  if (!root) {
    return;
  }

  const user =
    Auth.getUser();

  const loggedIn =
    Auth.isLoggedIn();

  let firstName =
    'Profile';

  if (
    user &&
    user.name
  ) {
    firstName =
      user.name
        .trim()
        .split(/\s+/)[0] ||
      'Profile';
  }

  root.innerHTML = `
    <nav class="navbar">

      <div class="navbar-inner">

        <!-- LOGO -->

        <a
          href="/"
          class="logo"
          aria-label="NM Store home"
        >
          <img
            src="/images/logo.png"
            alt="NM Store"
          >
        </a>

        <!-- SEARCH -->

        <form
          class="search-bar"
          id="navbar-search-form"
          autocomplete="off"
          role="search"
        >

          <input
            type="text"
            id="navbar-search-input"
            placeholder="Search products, brands & more..."
            autocomplete="off"
            aria-label="Search products"
          />

          <button
            type="submit"
            aria-label="Search"
            title="Search"
          >
            🔍
          </button>

        </form>

        <!-- MOBILE MENU -->

        <button
          class="mobile-menu-toggle"
          id="mobile-menu-toggle"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded="false"
        >
          ☰
        </button>

        <!-- NAVIGATION -->

        <div
          class="nav-links"
          id="main-nav-links"
        >

          ${
            loggedIn
              ? `
                <a
                  href="/wishlist"
                  class="nav-action"
                >
                  <span class="nav-icon">
                    ♥
                  </span>

                  <span>
                    Wishlist
                  </span>

                  <span
                    class="badge"
                    id="wishlist-count"
                  ></span>
                </a>

                <a
                  href="/cart"
                  class="nav-action"
                >
                  <span class="nav-icon">
                    🛒
                  </span>

                  <span>
                    Cart
                  </span>

                  <span
                    class="badge"
                    id="cart-count"
                  ></span>
                </a>

                <a
                  href="/orders"
                  class="nav-action"
                >
                  <span class="nav-icon">
                    📦
                  </span>

                  <span>
                    Orders
                  </span>
                </a>

                <a
                  href="/profile"
                  class="nav-action profile-link"
                >
                  <span class="nav-icon">
                    👤
                  </span>

                  <span>
                    ${escapeHtml(
                      firstName
                    )}
                  </span>
                </a>

                ${
                  user &&
                  user.role ===
                    'admin'
                    ? `
                      <a
                        href="/admin"
                        class="nav-action admin-link"
                      >
                        <span class="nav-icon">
                          ⚙
                        </span>

                        <span>
                          Admin
                        </span>
                      </a>
                    `
                    : ''
                }

                <a
                  href="#"
                  id="logout-link"
                  class="nav-action logout-link"
                >
                  <span class="nav-icon">
                    ↪
                  </span>

                  <span>
                    Logout
                  </span>
                </a>
              `
              : `
                <a
                  href="/login"
                  class="nav-action login-link"
                >
                  <span class="nav-icon">
                    👤
                  </span>

                  <span>
                    Login
                  </span>
                </a>

                <a
                  href="/register"
                  class="nav-action register-link"
                >
                  <span>
                    Register
                  </span>
                </a>
              `
          }

        </div>

      </div>

    </nav>

    <!-- CATEGORY BAR -->

    <div class="categories-bar">

      <div
        class="container categories-inner"
        id="navbar-categories"
      >

        <span class="category-loading">
          Loading categories...
        </span>

      </div>

    </div>
  `;

  // Setup search
  setupLiveSearch();

  // Setup mobile menu
  setupMobileMenu();

  // ===================================================
  // LOGOUT
  // ===================================================

  const logoutLink =
    document.getElementById(
      'logout-link'
    );

  if (logoutLink) {
    logoutLink.addEventListener(
      'click',
      async (event) => {
        event.preventDefault();

        logoutLink.classList.add(
          'is-loading'
        );

        logoutLink.style.pointerEvents =
          'none';

        try {
          await apiRequest(
            '/auth/logout',
            {
              method: 'POST',
            }
          );
        } catch {
          // Local session still gets cleared.
        }

        Auth.clearSession();

        showToast(
          'Logged out successfully',
          'success'
        );

        setTimeout(() => {
          window.location.href =
            '/';
        }, 600);
      }
    );
  }

  // ===================================================
  // LOAD CATEGORIES
  // ===================================================

  try {
    const data =
      await apiRequest(
        '/categories'
      );

    const categories =
      data.categories || [];

    renderCategoryLinks(
      categories
    );
  } catch (error) {
    console.error(
      'Could not load categories:',
      error
    );

    const categoryContainer =
      document.getElementById(
        'navbar-categories'
      );

    if (categoryContainer) {
      categoryContainer.innerHTML = `
        <a
          href="/products"
          class="category-all"
        >
          <span>☰</span>
          All Products
        </a>
      `;
    }
  }

  // Update cart/wishlist
  updateNavBadges();
}

// =====================================================
// MOBILE NAVIGATION
// =====================================================

function setupMobileMenu() {
  const toggle =
    document.getElementById(
      'mobile-menu-toggle'
    );

  const nav =
    document.getElementById(
      'main-nav-links'
    );

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener(
    'click',
    () => {
      const isOpen =
        nav.classList.toggle(
          'mobile-open'
        );

      toggle.setAttribute(
        'aria-expanded',
        String(isOpen)
      );

      toggle.textContent =
        isOpen ? '✕' : '☰';
    }
  );

  nav
    .querySelectorAll('a')
    .forEach((link) => {
      link.addEventListener(
        'click',
        () => {
          nav.classList.remove(
            'mobile-open'
          );

          toggle.setAttribute(
            'aria-expanded',
            'false'
          );

          toggle.textContent =
            '☰';
        }
      );
    });
}

// =====================================================
// FOOTER
// =====================================================

function renderFooter() {
  const root =
    document.getElementById(
      'footer-root'
    );

  if (!root) {
    return;
  }

  root.innerHTML = `
    <footer class="footer">

      <div class="container">

        <div class="footer-grid">

          <!-- BRAND -->

          <div class="footer-brand">

            <a
              href="/"
              aria-label="NM Store home"
            >
              <img
                src="/images/logo.png"
                alt="NM Store"
                class="footer-logo"
              >
            </a>

            <p>
              Your one-stop shop for
              everyday essentials,
              smart deals and quality
              products.
            </p>

            <div class="footer-trust">
              <span>
                🔒 Secure
              </span>

              <span>
                🚚 Fast delivery
              </span>
            </div>

          </div>

          <!-- SHOP -->

          <div>

            <h4>
              Shop
            </h4>

            <a href="/products">
              All Products
            </a>

            <a
              href="/products?featured=true"
            >
              Featured
            </a>

            <a
              href="/products?sort=newest"
            >
              New Arrivals
            </a>

            <a
              href="/products?sort=popular"
            >
              Popular Products
            </a>

          </div>

          <!-- ACCOUNT -->

          <div>

            <h4>
              Account
            </h4>

            <a href="/profile">
              My Profile
            </a>

            <a href="/orders">
              My Orders
            </a>

            <a href="/wishlist">
              Wishlist
            </a>

            <a href="/cart">
              Shopping Cart
            </a>

          </div>

          <!-- NEWSLETTER -->

          <div>

            <h4>
              Stay Updated
            </h4>

            <p>
              Get updates about new
              products, offers and
              special deals.
            </p>

            <form
              class="newsletter"
              id="newsletter-form"
            >

              <input
                type="email"
                id="newsletter-email"
                placeholder="Your email"
                autocomplete="email"
                aria-label="Email address"
              />

              <button
                class="btn btn-secondary btn-sm"
                id="newsletter-btn"
                type="submit"
              >
                Join
              </button>

            </form>

          </div>

        </div>

        <div class="footer-bottom">

          <span>
            &copy;
            ${new Date().getFullYear()}
            NM Store.
            All rights reserved.
          </span>

          <span>
            Built for smarter shopping.
          </span>

        </div>

      </div>

    </footer>
  `;

  setupNewsletter();
}

// =====================================================
// NEWSLETTER
// =====================================================

function setupNewsletter() {
  const form =
    document.getElementById(
      'newsletter-form'
    );

  const emailInput =
    document.getElementById(
      'newsletter-email'
    );

  const button =
    document.getElementById(
      'newsletter-btn'
    );

  if (
    !form ||
    !emailInput ||
    !button
  ) {
    return;
  }

  form.addEventListener(
    'submit',
    (event) => {
      event.preventDefault();

      const email =
        emailInput.value.trim();

      if (!email) {
        showToast(
          'Please enter your email address',
          'error'
        );

        emailInput.focus();

        return;
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailRegex.test(email)
      ) {
        showToast(
          'Please enter a valid email address',
          'error'
        );

        emailInput.focus();

        return;
      }

      button.disabled = true;

      button.textContent =
        'Joined ✓';

      showToast(
        'Thanks for subscribing!',
        'success'
      );

      emailInput.value = '';

      setTimeout(() => {
        button.disabled = false;

        button.textContent =
          'Join';
      }, 1800);
    }
  );
}

// =====================================================
// AUTH GUARDS
// =====================================================

function requireLogin() {
  if (!Auth.isLoggedIn()) {
    showToast(
      'Please log in to continue',
      'error'
    );

    setTimeout(() => {
      window.location.href =
        '/login';
    }, 800);

    return false;
  }

  return true;
}

function requireAdmin() {
  if (
    !Auth.isLoggedIn() ||
    !Auth.isAdmin()
  ) {
    showToast(
      'Admin access required',
      'error'
    );

    setTimeout(() => {
      window.location.href =
        '/';
    }, 800);

    return false;
  }

  return true;
}

// =====================================================
// GLOBAL HELPERS
// =====================================================

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

// =====================================================
// AUTO RENDER
// =====================================================

document.addEventListener(
  'DOMContentLoaded',
  () => {
    renderNavbar();
    renderFooter();
  }
);