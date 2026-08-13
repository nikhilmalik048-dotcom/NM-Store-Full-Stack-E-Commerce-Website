// ==============================
// home.js - Home page logic
// ==============================

async function loadSection(endpoint, containerId) {
  const container = document.getElementById(containerId);
  try {
    const data = await apiRequest(endpoint);
    if (!data.products || data.products.length === 0) {
      container.innerHTML = '<div class="empty-state">No products found.</div>';
      return;
    }
    container.innerHTML = data.products.map(productCardHTML).join('');
    attachProductCardEvents(container);
  } catch (err) {
    container.innerHTML = `<div class="empty-state">Could not load products: ${err.message}</div>`;
  }
}

async function loadHomeCategories() {
  const container = document.getElementById('home-categories');
  try {
    const { categories } = await apiRequest('/categories');
    if (categories.length === 0) {
      container.innerHTML = '<div class="empty-state">No categories yet.</div>';
      return;
    }
    container.innerHTML = categories.map((c) => `
      <a href="/products?category=${c._id}" class="product-card" style="text-align:center; padding:20px 10px; align-items:center; justify-content:center;">
        <div style="font-size:36px; margin-bottom:8px;">🛍️</div>
        <h3>${c.name}</h3>
      </a>
    `).join('');
  } catch (err) {
    container.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSection('/products?featured=true&limit=8', 'featured-products');
  loadSection('/products?sort=newest&limit=8', 'latest-products');
  loadSection('/products?sort=popular&limit=8', 'popular-products');
  loadHomeCategories();
});
