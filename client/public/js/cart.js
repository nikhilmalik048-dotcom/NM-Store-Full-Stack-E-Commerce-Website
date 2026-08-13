// ==============================
// cart.js - Shopping Cart page logic
// ==============================

async function loadCart() {
  const root = document.getElementById('cart-root');
  if (!requireLogin()) return;

  try {
    const { cart, totals } = await apiRequest('/cart');

    if (cart.items.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="icon">🛒</div>
          <p>Your cart is empty.</p>
          <a href="/products" class="btn btn-primary mt-2">Start Shopping</a>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="cart-layout">
        <div id="cart-items"></div>
        <div class="card">
          <h3 class="mb-2">Order Summary</h3>
          <div class="summary-row"><span>Subtotal</span><span>${formatPrice(totals.itemsPrice)}</span></div>
          ${totals.discount > 0 ? `<div class="summary-row" style="color:var(--success);"><span>Coupon Discount ${cart.couponCode ? `(${cart.couponCode})` : ''}</span><span>-${formatPrice(totals.discount)}</span></div>` : ''}
          <div class="summary-row"><span>Tax (5%)</span><span>${formatPrice(totals.taxPrice)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${totals.shippingPrice === 0 ? 'FREE' : formatPrice(totals.shippingPrice)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${formatPrice(totals.totalPrice)}</span></div>

          <div class="form-group mt-2">
            <label>Coupon Code</label>
            <div class="flex" style="gap:8px;">
              <input type="text" id="coupon-input" placeholder="Enter code" value="${cart.couponCode || ''}" />
              ${cart.couponCode
                ? `<button class="btn btn-outline btn-sm" id="remove-coupon-btn">Remove</button>`
                : `<button class="btn btn-outline btn-sm" id="apply-coupon-btn">Apply</button>`}
            </div>
          </div>

          <button class="btn btn-primary btn-block mt-2" id="checkout-btn">Proceed to Checkout</button>
          <button class="btn btn-outline btn-block mt-1" id="clear-cart-btn">Clear Cart</button>
        </div>
      </div>
    `;

    renderCartItems(cart);

    document.getElementById('checkout-btn').addEventListener('click', () => (window.location.href = '/checkout'));
    document.getElementById('clear-cart-btn').addEventListener('click', async () => {
      if (!confirmAction('Clear all items from your cart?')) return;
      try {
        await apiRequest('/cart', { method: 'DELETE' });
        showToast('Cart cleared', 'success');
        loadCart();
        updateNavBadges();
      } catch (err) { showToast(err.message, 'error'); }
    });

    const applyBtn = document.getElementById('apply-coupon-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', async () => {
        const code = document.getElementById('coupon-input').value.trim();
        if (!code) return showToast('Please enter a coupon code', 'error');
        try {
          await apiRequest('/cart/coupon', { method: 'POST', body: { code } });
          showToast('Coupon applied', 'success');
          loadCart();
        } catch (err) { showToast(err.message, 'error'); }
      });
    }

    const removeCouponBtn = document.getElementById('remove-coupon-btn');
    if (removeCouponBtn) {
      removeCouponBtn.addEventListener('click', async () => {
        try {
          await apiRequest('/cart/coupon', { method: 'DELETE' });
          showToast('Coupon removed', 'success');
          loadCart();
        } catch (err) { showToast(err.message, 'error'); }
      });
    }
  } catch (err) {
    root.innerHTML = `<div class="empty-state">Error loading cart: ${err.message}</div>`;
  }
}

function renderCartItems(cart) {
  const container = document.getElementById('cart-items');
  container.innerHTML = cart.items.map((item) => {
    const product = item.product;
    if (!product) return '';
    const image = product.images && product.images[0] ? product.images[0] : 'https://placehold.co/100x100?text=No+Image';
    return `
      <div class="cart-item" data-id="${product._id}">
        <img src="${image}" alt="${product.name}" />
        <div class="details">
          <strong>${product.name}</strong>
          <p style="color:var(--text-light); font-size:13px;">${formatPrice(item.price)} each</p>
          <div class="qty-control mt-1">
            <button class="qty-minus">-</button>
            <span class="qty-value">${item.quantity}</span>
            <button class="qty-plus">+</button>
          </div>
        </div>
        <div class="text-center">
          <strong>${formatPrice(item.price * item.quantity)}</strong>
          <br />
          <button class="btn btn-sm btn-outline mt-1 remove-item-btn">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.cart-item').forEach((el) => {
    const productId = el.dataset.id;

    el.querySelector('.qty-plus').addEventListener('click', () => updateQty(productId, el, 1));
    el.querySelector('.qty-minus').addEventListener('click', () => updateQty(productId, el, -1));
    el.querySelector('.remove-item-btn').addEventListener('click', async () => {
      try {
        await apiRequest(`/cart/${productId}`, { method: 'DELETE' });
        showToast('Item removed', 'success');
        loadCart();
        updateNavBadges();
      } catch (err) { showToast(err.message, 'error'); }
    });
  });
}

async function updateQty(productId, el, delta) {
  const qtySpan = el.querySelector('.qty-value');
  const newQty = parseInt(qtySpan.textContent) + delta;
  if (newQty < 1) return;

  try {
    await apiRequest(`/cart/${productId}`, { method: 'PUT', body: { quantity: newQty } });
    loadCart();
    updateNavBadges();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadCart);
