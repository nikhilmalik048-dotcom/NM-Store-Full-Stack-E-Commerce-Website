// ==============================
// orders.js - My Orders (list + detail + cancel + invoice)
// ==============================

async function loadOrders() {
  const root = document.getElementById('orders-root');
  if (!requireLogin()) return;

  try {
    const { orders } = await apiRequest('/orders/my-orders');
    if (orders.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="icon">📦</div>
          <p>You haven't placed any orders yet.</p>
          <a href="/products" class="btn btn-primary mt-2">Start Shopping</a>
        </div>`;
      return;
    }

    root.innerHTML = orders.map((o) => `
      <div class="card mb-2">
        <div class="flex-between" style="flex-wrap:wrap; gap:10px;">
          <div>
            <strong>${o.orderNumber}</strong>
            <p style="font-size:12.5px; color:var(--text-light);">Placed on ${new Date(o.createdAt).toLocaleDateString()}</p>
          </div>
          <span class="status-badge status-${o.status}">${o.status}</span>
        </div>
        <div class="flex-between mt-2" style="flex-wrap:wrap; gap:10px;">
          <span style="font-size:13.5px;">${o.items.length} item(s) • ${formatPrice(o.totalPrice)}</span>
          <div class="flex" style="gap:8px;">
            <button class="btn btn-sm btn-outline view-order-btn" data-id="${o._id}">View Details</button>
            ${['Pending', 'Packed'].includes(o.status) ? `<button class="btn btn-sm btn-danger cancel-order-btn" data-id="${o._id}">Cancel</button>` : ''}
          </div>
        </div>
      </div>
    `).join('');

    root.querySelectorAll('.view-order-btn').forEach((btn) => {
      btn.addEventListener('click', () => viewOrderDetail(btn.dataset.id));
    });
    root.querySelectorAll('.cancel-order-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirmAction('Are you sure you want to cancel this order?')) return;
        try {
          await apiRequest(`/orders/${btn.dataset.id}/cancel`, { method: 'PUT', body: { reason: 'Cancelled by customer' } });
          showToast('Order cancelled', 'success');
          loadOrders();
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
  } catch (err) {
    root.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

async function viewOrderDetail(orderId) {
  document.getElementById('orders-root').parentElement.style.display = 'none';
  const section = document.getElementById('order-detail-section');
  section.style.display = 'block';
  const root = document.getElementById('order-detail-root');
  root.innerHTML = '<div class="spinner"></div>';

  try {
    const { order } = await apiRequest(`/orders/${orderId}`);
    root.innerHTML = `
      <div class="card mb-2">
        <div class="flex-between" style="flex-wrap:wrap;">
          <div>
            <h3>${order.orderNumber}</h3>
            <p style="font-size:13px; color:var(--text-light);">Placed on ${new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span class="status-badge status-${order.status}">${order.status}</span>
        </div>

        <h4 class="mt-3 mb-1">Items</h4>
        ${order.items.map((item) => `
          <div class="cart-item">
            <img src="${item.image || 'https://placehold.co/70x70?text=No+Image'}" alt="${item.name}" />
            <div class="details">
              <strong>${item.name}</strong>
              <p style="font-size:13px; color:var(--text-light);">Qty: ${item.quantity} × ${formatPrice(item.price)}</p>
            </div>
            <strong>${formatPrice(item.price * item.quantity)}</strong>
          </div>
        `).join('')}

        <h4 class="mt-3 mb-1">Shipping Address</h4>
        <p style="font-size:13.5px;">
          ${order.shippingAddress.fullName} - ${order.shippingAddress.phone}<br/>
          ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}, ${order.shippingAddress.country}
        </p>

        <h4 class="mt-3 mb-1">Order Summary</h4>
        <div class="summary-row"><span>Items Total</span><span>${formatPrice(order.itemsPrice)}</span></div>
        ${order.discountAmount > 0 ? `<div class="summary-row"><span>Discount</span><span>-${formatPrice(order.discountAmount)}</span></div>` : ''}
        <div class="summary-row"><span>Tax</span><span>${formatPrice(order.taxPrice)}</span></div>
        <div class="summary-row"><span>Shipping</span><span>${order.shippingPrice === 0 ? 'FREE' : formatPrice(order.shippingPrice)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatPrice(order.totalPrice)}</span></div>
        <p style="font-size:13px; margin-top:6px;">Payment: ${order.paymentMethod} (${order.paymentStatus})</p>

        <h4 class="mt-3 mb-1">Order Timeline</h4>
        ${order.statusHistory.map((h) => `<p style="font-size:13px; color:var(--text-light);">${h.status} — ${new Date(h.changedAt).toLocaleString()}</p>`).join('')}

        <button class="btn btn-outline btn-sm mt-3" id="print-invoice-btn">🖨️ Print Invoice</button>
      </div>
    `;

    document.getElementById('print-invoice-btn').addEventListener('click', () => window.print());
  } catch (err) {
    root.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

document.getElementById('back-to-orders').addEventListener('click', () => {
  document.getElementById('order-detail-section').style.display = 'none';
  document.getElementById('orders-root').parentElement.style.display = 'block';
});

document.addEventListener('DOMContentLoaded', loadOrders);
