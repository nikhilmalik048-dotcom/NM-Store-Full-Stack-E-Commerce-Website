// ==============================
// checkout.js - Checkout page logic
// ==============================

let savedAddresses = [];
let cartTotals = null;

async function loadCheckout() {
  const root = document.getElementById('checkout-root');
  if (!requireLogin()) return;

  try {
    const [cartData, userData] = await Promise.all([
      apiRequest('/cart'),
      apiRequest('/auth/me'),
    ]);

    if (cartData.cart.items.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="icon">🛒</div>
          <p>Your cart is empty. Add items before checking out.</p>
          <a href="/products" class="btn btn-primary mt-2">Browse Products</a>
        </div>`;
      return;
    }

    cartTotals = cartData.totals;
    savedAddresses = userData.user.addresses || [];

    root.innerHTML = `
      <div class="cart-layout">
        <div>
          <div class="card mb-3">
            <h3 class="mb-2">Shipping Address</h3>
            <div id="saved-addresses"></div>
            <button class="btn btn-outline btn-sm mt-2" id="new-address-toggle">+ Add New Address</button>
            <form id="address-form" style="display:none;" class="mt-2">
              <div class="form-group"><label>Full Name</label><input type="text" id="addr-name" required /></div>
              <div class="form-group"><label>Phone</label><input type="tel" id="addr-phone" required /></div>
              <div class="form-group"><label>Street Address</label><input type="text" id="addr-street" required /></div>
              <div class="flex" style="gap:10px;">
                <div class="form-group" style="flex:1;"><label>City</label><input type="text" id="addr-city" required /></div>
                <div class="form-group" style="flex:1;"><label>State</label><input type="text" id="addr-state" required /></div>
              </div>
              <div class="flex" style="gap:10px;">
                <div class="form-group" style="flex:1;"><label>Zip Code</label><input type="text" id="addr-zip" required /></div>
                <div class="form-group" style="flex:1;"><label>Country</label><input type="text" id="addr-country" value="India" required /></div>
              </div>
              <button type="submit" class="btn btn-primary btn-sm">Save Address</button>
            </form>
          </div>

          <div class="card">
            <h3 class="mb-2">Payment Method</h3>
            <div class="form-group">
              <label style="display:flex; align-items:center; gap:8px; font-weight:400;">
                <input type="radio" name="payment" value="COD" checked style="width:auto;" /> Cash on Delivery (COD)
              </label>
              <p style="font-size:12.5px; color:var(--text-light); margin-top:6px;">
                Stripe / Razorpay integration can be added here later — the payment module is built to be expandable.
              </p>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="mb-2">Order Summary</h3>
          <div class="summary-row"><span>Subtotal</span><span>${formatPrice(cartTotals.itemsPrice)}</span></div>
          ${cartTotals.discount > 0 ? `<div class="summary-row" style="color:var(--success);"><span>Discount</span><span>-${formatPrice(cartTotals.discount)}</span></div>` : ''}
          <div class="summary-row"><span>Tax</span><span>${formatPrice(cartTotals.taxPrice)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>${cartTotals.shippingPrice === 0 ? 'FREE' : formatPrice(cartTotals.shippingPrice)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${formatPrice(cartTotals.totalPrice)}</span></div>
          <button class="btn btn-primary btn-block mt-2" id="place-order-btn">Place Order</button>
        </div>
      </div>
    `;

    renderAddresses();

    document.getElementById('new-address-toggle').addEventListener('click', () => {
      const form = document.getElementById('address-form');
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('address-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const address = {
        fullName: document.getElementById('addr-name').value.trim(),
        phone: document.getElementById('addr-phone').value.trim(),
        street: document.getElementById('addr-street').value.trim(),
        city: document.getElementById('addr-city').value.trim(),
        state: document.getElementById('addr-state').value.trim(),
        zipCode: document.getElementById('addr-zip').value.trim(),
        country: document.getElementById('addr-country').value.trim(),
      };
      try {
        const data = await apiRequest('/users/addresses', { method: 'POST', body: address });
        savedAddresses = data.addresses;
        showToast('Address saved', 'success');
        renderAddresses();
        document.getElementById('address-form').reset();
        document.getElementById('address-form').style.display = 'none';
      } catch (err) { showToast(err.message, 'error'); }
    });

    document.getElementById('place-order-btn').addEventListener('click', placeOrder);
  } catch (err) {
    root.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

function renderAddresses() {
  const container = document.getElementById('saved-addresses');
  if (savedAddresses.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light); font-size:13.5px;">No saved addresses. Add one below.</p>';
    return;
  }
  container.innerHTML = savedAddresses.map((a, i) => `
    <label class="card mb-1" style="display:flex; gap:10px; align-items:flex-start; padding:12px; cursor:pointer;">
      <input type="radio" name="selected-address" value="${a._id}" ${i === 0 ? 'checked' : ''} style="margin-top:4px; width:auto;" />
      <div style="font-size:13.5px;">
        <strong>${a.fullName}</strong> - ${a.phone}<br/>
        ${a.street}, ${a.city}, ${a.state} ${a.zipCode}, ${a.country}
      </div>
    </label>
  `).join('');
}

async function placeOrder() {
  const selected = document.querySelector('input[name="selected-address"]:checked');
  if (!selected) return showToast('Please select or add a shipping address', 'error');

  const address = savedAddresses.find((a) => a._id === selected.value);
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = 'Placing order...';

  try {
    const shippingAddress = {
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
    };

    const data = await apiRequest('/orders', {
      method: 'POST',
      body: { shippingAddress, billingAddress: shippingAddress, paymentMethod },
    });

    showToast('Order placed successfully!', 'success');
    setTimeout(() => (window.location.href = `/order-success.html?orderId=${data.order._id}`), 700);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

document.addEventListener('DOMContentLoaded', loadCheckout);
