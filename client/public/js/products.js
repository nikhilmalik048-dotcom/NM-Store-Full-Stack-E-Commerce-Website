// ==============================
// products.js - All Products page (search, filter, sort, paginate)
// ==============================

let currentPage = 1;

function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

function buildFilters() {
  const params = getQueryParams();
  return {
    search: params.get('search') || '',
    category: document.getElementById('filter-category').value || params.get('category') || '',
    brand: document.getElementById('filter-brand').value || '',
    minPrice: document.getElementById('filter-min-price').value || '',
    maxPrice: document.getElementById('filter-max-price').value || '',
    minRating: document.getElementById('filter-rating').value || '',
    sort: document.getElementById('sort-select').value || params.get('sort') || 'newest',
    featured: params.get('featured') || '',
  };
}

async function loadFilterOptions() {
  try {
    const { categories } = await apiRequest('/categories');
    const catSelect = document.getElementById('filter-category');
    const params = getQueryParams();
    categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c._id;
      opt.textContent = c.name;
      if (params.get('category') === c._id) opt.selected = true;
      catSelect.appendChild(opt);
    });
  } catch {}

  try {
    const { brands } = await apiRequest('/brands');
    const brandSelect = document.getElementById('filter-brand');
    brands.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b._id;
      opt.textContent = b.name;
      brandSelect.appendChild(opt);
    });
  } catch {}
}

async function loadProducts(page = 1) {
  currentPage = page;
  const container = document.getElementById('products-container');
  container.innerHTML = '<div class="spinner"></div>';

  const filters = buildFilters();
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => { if (val) params.set(key, val); });
  params.set('page', page);
  params.set('limit', 12);

  document.getElementById('results-title').textContent = filters.search
    ? `Search results for "${filters.search}"`
    : 'All Products';

  try {
    const data = await apiRequest(`/products?${params.toString()}`);
    if (data.products.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="icon">🔍</div>
          <p>No products found. Try adjusting your filters.</p>
        </div>`;
      document.getElementById('pagination').innerHTML = '';
      return;
    }
    container.innerHTML = data.products.map(productCardHTML).join('');
    attachProductCardEvents(container);
    renderPagination(data.page, data.pages);
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">Error: ${err.message}</div>`;
  }
}

function renderPagination(page, pages) {
  const el = document.getElementById('pagination');
  if (pages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="btn ${i === page ? 'btn-primary' : 'btn-outline'} btn-sm" data-page="${i}">${i}</button>`;
  }
  el.innerHTML = html;

  el.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      loadProducts(parseInt(btn.dataset.page));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadFilterOptions();

  const params = getQueryParams();
  if (params.get('sort')) document.getElementById('sort-select').value = params.get('sort');

  loadProducts(1);

  document.getElementById('apply-filters').addEventListener('click', () => loadProducts(1));
  document.getElementById('clear-filters').addEventListener('click', () => {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-brand').value = '';
    document.getElementById('filter-min-price').value = '';
    document.getElementById('filter-max-price').value = '';
    document.getElementById('filter-rating').value = '';
    document.getElementById('sort-select').value = 'newest';
    window.history.replaceState({}, '', '/products');
    loadProducts(1);
  });
  document.getElementById('sort-select').addEventListener('change', () => loadProducts(1));
});
