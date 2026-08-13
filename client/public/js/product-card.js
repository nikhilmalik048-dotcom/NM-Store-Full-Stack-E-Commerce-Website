// ==============================
// product-card.js - Shared product card renderer
// Used by home.js, products.js
// ==============================

function productCardHTML(product) {
  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const image = product.images && product.images[0] ? product.images[0] : 'https://placehold.co/300x300?text=No+Image';
  const stockClass = product.stock === 0 ? 'low' : product.stock <= 5 ? 'low' : 'ok';
  const stockText = product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock';

  return `
    <div class="product-card" data-id="${product._id}">
      <button class="wishlist-btn" data-action="wishlist" data-id="${product._id}" title="Add to wishlist">♡</button>
      <a href="/product-detail?id=${product._id}">
        <div class="img-wrap"><img src="${image}" alt="${escapeHtml(product.name)}" loading="lazy" /></div>
      </a>
      <div class="info">
        <div class="cat">${product.category ? escapeHtml(product.category.name) : ''}</div>
        <a href="/product-detail?id=${product._id}"><h3>${escapeHtml(product.name)}</h3></a>
        <div class="rating">${renderStars(product.ratingsAverage)} <span style="color:var(--text-light)">(${product.ratingsCount || 0})</span></div>
        <div class="price-row">
          <span class="price">${formatPrice(finalPrice)}</span>
          ${hasDiscount ? `<span class="price-strike">${formatPrice(product.price)}</span><span class="discount-tag">${discountPercent}% off</span>` : ''}
        </div>
        <div class="stock-badge ${stockClass}">${stockText}</div>
        <button class="btn btn-primary btn-block btn-sm" data-action="add-to-cart" data-id="${product._id}" ${product.stock === 0 ? 'disabled' : ''}>
          ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Delegated event handling for "Add to Cart" and "Wishlist" buttons
// Call this once per page after rendering product cards into a container.
function attachProductCardEvents(container) {
  container.addEventListener('click', async (e) => {
    const cartBtn = e.target.closest('[data-action="add-to-cart"]');
    const wishBtn = e.target.closest('[data-action="wishlist"]');

    if (cartBtn) {
      e.preventDefault();
      if (!requireLogin()) return;
      const productId = cartBtn.dataset.id;
      try {
        await apiRequest('/cart', { method: 'POST', body: { productId, quantity: 1 } });
        showToast('Added to cart', 'success');
        updateNavBadges();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }

    if (wishBtn) {
      e.preventDefault();
      if (!requireLogin()) return;
      const productId = wishBtn.dataset.id;
      try {
        await apiRequest('/wishlist', { method: 'POST', body: { productId } });
        wishBtn.textContent = '♥';
        showToast('Added to wishlist', 'success');
        updateNavBadges();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  });
}
