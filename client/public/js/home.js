// ==============================
// home.js - Premium Home Page Logic
// ==============================

// ----------------------------------------
// Load product section
// ----------------------------------------

async function loadSection(endpoint, containerId) {
  const container = document.getElementById(containerId);

  if (!container) return;

  // Loading skeleton
  container.innerHTML = `
    ${Array.from({ length: 4 })
      .map(
        () => `
          <div class="product-card home-loading-card">
            <div class="product-skeleton-image"></div>
            <div class="product-skeleton-content">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line medium"></div>
              <div class="skeleton-button"></div>
            </div>
          </div>
        `
      )
      .join('')}
  `;

  try {
    const data = await apiRequest(endpoint);

    if (
      !data ||
      !data.products ||
      data.products.length === 0
    ) {
      container.innerHTML = `
        <div class="empty-state home-empty-state">
          <div class="empty-icon">🛍️</div>
          <h3>No products found</h3>
          <p>Check back soon for new products.</p>
          <a href="/products" class="btn btn-primary">
            Browse Products
          </a>
        </div>
      `;

      return;
    }

    container.innerHTML = data.products
      .map(productCardHTML)
      .join('');

    attachProductCardEvents(container);

  } catch (err) {

    console.error(
      `Failed to load ${containerId}:`,
      err
    );

    container.innerHTML = `
      <div class="empty-state home-empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Unable to load products</h3>
        <p>
          ${
            escapeHtml(
              err.message ||
              'Something went wrong.'
            )
          }
        </p>

        <button
          type="button"
          class="btn btn-primary"
          onclick="loadSection('${endpoint}', '${containerId}')"
        >
          Try Again
        </button>
      </div>
    `;
  }
}


// ----------------------------------------
// Load categories
// ----------------------------------------

async function loadHomeCategories() {

  const container =
    document.getElementById(
      'home-categories'
    );

  if (!container) return;


  // Loading state
  container.innerHTML = `
    ${Array.from({ length: 6 })
      .map(
        () => `
          <div class="category-skeleton">
            <div class="category-skeleton-icon"></div>
            <div class="skeleton-line"></div>
          </div>
        `
      )
      .join('')}
  `;


  try {

    const data =
      await apiRequest('/categories');

    const categories =
      data.categories || [];


    if (categories.length === 0) {

      container.innerHTML = `
        <div class="empty-state home-empty-state">
          <div class="empty-icon">📂</div>
          <h3>No categories yet</h3>
          <p>Categories will appear here soon.</p>
        </div>
      `;

      return;
    }


    // Category icons
    const categoryIcons = {

      'Electronics': '📱',

      'Fashion': '👕',

      'Beauty': '💄',

      'Fragrances': '🌸',

      'Furniture': '🛋️',

      'Groceries': '🛒',

      'Home Decoration': '🏠',

      'Kitchen Accessories': '🍳',

      'Laptops': '💻',

      'Mens Shirts': '👔',

      'Mens Shoes': '👟',

      'Mens Watches': '⌚',

      'Mobile Accessories': '📲',

      'Sports': '⚽',

      'Books': '📚',

      'Toys': '🧸',

      'Jewellery': '💎',

      'Beauty & Personal Care': '✨',

      'Home & Kitchen': '🏡'
    };


    container.innerHTML =
      categories
        .map((category) => {

          const name =
            category.name || 'Category';

          const icon =
            categoryIcons[name] ||
            '🛍️';

          const categoryId =
            category._id || '';

          return `
            <a
              href="/products?category=${encodeURIComponent(
                categoryId
              )}"
              class="home-category-card"
              title="Shop ${escapeHtml(name)}"
            >

              <div class="category-icon-wrap">

                <span class="category-icon">
                  ${icon}
                </span>

              </div>

              <div class="category-info">

                <h3>
                  ${escapeHtml(name)}
                </h3>

                <span class="category-link">
                  Shop now →
                </span>

              </div>

            </a>
          `;
        })
        .join('');


  } catch (err) {

    console.error(
      'Failed to load categories:',
      err
    );

    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>Could not load categories.</p>
      </div>
    `;
  }
}


// ----------------------------------------
// Add subtle reveal animation
// ----------------------------------------

function revealHomeSections() {

  const sections =
    document.querySelectorAll(
      '.section'
    );


  sections.forEach(
    (section, index) => {

      section.style.animationDelay =
        `${index * 80}ms`;

      section.classList.add(
        'home-section-visible'
      );

    }
  );
}


// ----------------------------------------
// Newsletter enhancement
// ----------------------------------------

function setupHomeNewsletter() {

  const form =
    document.querySelector(
      '#newsletter-form'
    );

  if (!form) return;

  if (
    form.dataset.homeNewsletterReady ===
    'true'
  ) {
    return;
  }

  form.dataset.homeNewsletterReady =
    'true';


  form.addEventListener(
    'submit',
    (e) => {

      const input =
        form.querySelector(
          'input[type="email"]'
        );

      if (!input) return;


      const email =
        input.value.trim();


      if (!email) {

        e.preventDefault();

        showToast(
          'Please enter your email address.',
          'error'
        );

        input.focus();

        return;
      }


      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {

        e.preventDefault();

        showToast(
          'Please enter a valid email address.',
          'error'
        );

        input.focus();
      }

    }
  );
}


// ----------------------------------------
// Home page initialization
// ----------------------------------------

document.addEventListener(
  'DOMContentLoaded',
  () => {

    // Featured products
    loadSection(
      '/products?featured=true&limit=8',
      'featured-products'
    );


    // Latest products
    loadSection(
      '/products?sort=newest&limit=8',
      'latest-products'
    );


    // Popular products
    loadSection(
      '/products?sort=popular&limit=8',
      'popular-products'
    );


    // Categories
    loadHomeCategories();


    // Extra UI
    revealHomeSections();

    setupHomeNewsletter();

  }
);