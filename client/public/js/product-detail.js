// ==============================
// product-detail.js - Product detail page logic
// ==============================

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

function renderProductDetail(product) {
  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;
  const images = product.images && product.images.length > 0 ? product.images : ['https://placehold.co/500x500?text=No+Image'];

  const root = document.getElementById('product-detail-root');
  root.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:32px;" class="pd-grid">
      <div>
        <div class="card" style="padding:0; overflow:hidden;">
          <img id="main-image" src="${images[0]}" alt="${escapeHtml(product.name)}" style="width:100%; height:420px; object-fit:cover;" />
        </div>
        <div class="flex mt-2" style="gap:10px; overflow-x:auto;">
          ${images.map((img, i) => `<img src="${img}" data-index="${i}" class="thumb-img" style="width:70px; height:70px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid ${i === 0 ? 'var(--primary)' : 'transparent'};" />`).join('')}
        </div>
      </div>
      <div>
        <div class="cat mb-1">${product.category ? escapeHtml(product.category.name) : ''} ${product.brand ? ' • ' + escapeHtml(product.brand.name) : ''}</div>
        <h1 style="font-size:26px; margin-bottom:10px;">${escapeHtml(product.name)}</h1>
        <div class="rating mb-2" style="font-size:15px;">${renderStars(product.ratingsAverage)} <span style="color:var(--text-light)">(${product.ratingsCount || 0} reviews)</span></div>
        <div class="price-row mb-2" style="font-size:20px;">
          <span class="price" style="font-size:28px;">${formatPrice(finalPrice)}</span>
          ${hasDiscount ? `<span class="price-strike">${formatPrice(product.price)}</span><span class="discount-tag">${discountPercent}% off</span>` : ''}
        </div>
        <div class="stock-badge ${product.stock === 0 ? 'low' : product.stock <= 5 ? 'low' : 'ok'} mb-2">
          ${product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
        </div>
        <p style="color:var(--text-light); margin-bottom:20px;">${escapeHtml(product.description)}</p>

        <div class="flex mb-2" style="gap:10px; align-items:center;">
          <label style="font-weight:600; font-size:14px;">Quantity:</label>
          <div class="qty-control">
            <button id="qty-minus">-</button>
            <span id="qty-value">1</span>
            <button id="qty-plus">+</button>
          </div>
        </div>

        <div class="flex" style="gap:10px;">
          <button class="btn btn-primary" id="add-to-cart-btn" ${product.stock === 0 ? 'disabled' : ''} style="flex:1;">
            🛒 ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button class="btn btn-outline" id="add-to-wishlist-btn">♡ Wishlist</button>
        </div>

        <div class="card mt-3" style="background:#f9fafb;">
          <strong style="font-size:13.5px;">SKU:</strong> <span style="font-size:13.5px;">${product.sku}</span>
        </div>
      </div>
    </div>
    <style>@media (max-width: 800px) { .pd-grid { grid-template-columns: 1fr !important; } }</style>
  `;

  // Thumbnail switching
  document.querySelectorAll('.thumb-img').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.getElementById('main-image').src = thumb.src;
      document.querySelectorAll('.thumb-img').forEach((t) => (t.style.borderColor = 'transparent'));
      thumb.style.borderColor = 'var(--primary)';
    });
  });

  // Quantity control
  let qty = 1;
  document.getElementById('qty-plus').addEventListener('click', () => {
    if (qty < product.stock) { qty++; document.getElementById('qty-value').textContent = qty; }
  });
  document.getElementById('qty-minus').addEventListener('click', () => {
    if (qty > 1) { qty--; document.getElementById('qty-value').textContent = qty; }
  });

  document.getElementById('add-to-cart-btn').addEventListener('click', async () => {
    if (!requireLogin()) return;
    try {
      await apiRequest('/cart', { method: 'POST', body: { productId: product._id, quantity: qty } });
      showToast('Added to cart', 'success');
      updateNavBadges();
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('add-to-wishlist-btn').addEventListener('click', async () => {
    if (!requireLogin()) return;
    try {
      await apiRequest('/wishlist', { method: 'POST', body: { productId: product._id } });
      showToast('Added to wishlist', 'success');
      updateNavBadges();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

function renderReviewForm() {
  const container = document.getElementById('review-form-container');
  if (!Auth.isLoggedIn()) {
    container.innerHTML = `<p style="color:var(--text-light);">Please <a href="/login" style="color:var(--primary);">log in</a> to write a review.</p>`;
    return;
  }
  container.innerHTML = `
    <div class="card" style="background:#f9fafb;">
      <h3 class="mb-2">Write a Review</h3>
      <div class="form-group">
        <label>Your Rating</label>
        <div id="star-input">
          ${[1, 2, 3, 4, 5].map((n) => `<span class="star" data-value="${n}">☆</span>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Your Comment</label>
        <textarea id="review-comment" rows="3" placeholder="Share your experience with this product..."></textarea>
      </div>
      <button class="btn btn-primary" id="submit-review-btn">Submit Review</button>
    </div>
  `;

  let selectedRating = 0;
  const stars = document.querySelectorAll('#star-input .star');
  stars.forEach((star) => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.value);
      stars.forEach((s, i) => (s.textContent = i < selectedRating ? '★' : '☆'));
    });
  });

  document.getElementById('submit-review-btn').addEventListener('click', async () => {
    const comment = document.getElementById('review-comment').value.trim();
    if (selectedRating === 0) return showToast('Please select a star rating', 'error');
    if (!comment) return showToast('Please enter a comment', 'error');

    try {
      await apiRequest(`/reviews/product/${productId}`, { method: 'POST', body: { rating: selectedRating, comment } });
      showToast('Review submitted', 'success');
      loadReviews();
      document.getElementById('review-comment').value = '';
      selectedRating = 0;
      stars.forEach((s) => (s.textContent = '☆'));
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function loadReviews() {
  const container = document.getElementById('reviews-list');
  try {
    const { reviews } = await apiRequest(`/reviews/product/${productId}`);
    if (reviews.length === 0) {
      container.innerHTML = '<p style="color:var(--text-light);">No reviews yet. Be the first to review this product!</p>';
      return;
    }
    container.innerHTML = reviews.map((r) => `
      <div class="card mb-2">
        <div class="flex-between">
          <strong>${escapeHtml(r.user ? r.user.name : 'Anonymous')}</strong>
          <span style="color:var(--warning);">${renderStars(r.rating)}</span>
        </div>
        <p style="margin-top:6px; color:var(--text-dark); font-size:14px;">${escapeHtml(r.comment)}</p>
        <p style="margin-top:6px; font-size:12px; color:var(--text-light);">${new Date(r.createdAt).toLocaleDateString()}</p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p>Could not load reviews: ${err.message}</p>`;
  }
}

async function loadRelated() {
  const container = document.getElementById('related-products');
  try {
    const { products } = await apiRequest(`/products/${productId}/related`);
    container.innerHTML = products.length
      ? products.map(productCardHTML).join('')
      : '<p style="color:var(--text-light);">No related products found.</p>';
    attachProductCardEvents(container);
  } catch {
    container.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!productId) {
    document.getElementById('product-detail-root').innerHTML = '<div class="empty-state">No product specified.</div>';
    return;
  }
  try {
    const { product } = await apiRequest(`/products/${productId}`);
    renderProductDetail(product);
    document.title = `${product.name} - NM Store`;
  } catch (err) {
    document.getElementById('product-detail-root').innerHTML = `<div class="empty-state">Product not found.</div>`;
    return;
  }

  renderReviewForm();
  loadReviews();
  loadRelated();
});
