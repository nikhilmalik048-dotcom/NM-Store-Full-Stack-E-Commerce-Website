// ==============================
// admin-orders.js - Admin Orders Tab
// ==============================

async function renderOrdersTab() {
  try {
    const { orders } = await apiRequest('/orders?limit=100');

    adminContent().innerHTML = `
      <h2 class="mb-3">Manage Orders</h2>
      <div class="card" style="overflow-x:auto;">
        <table>
          <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody id="admin-orders-tbody"></tbody>
        </table>
      </div>
    `;

    const tbody = document.getElementById('admin-orders-tbody');
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No orders placed yet.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map((o) => `
      <tr>
        <td>${o.orderNumber}</td>
        <td>${o.user ? o.user.name : 'N/A'}<br/><span style="font-size:11.5px; color:var(--text-light);">${o.user ? o.user.email : ''}</span></td>
        <td>${o.items.length}</td>
        <td>${formatPrice(o.totalPrice)}</td>
        <td>
          <select class="status-select" data-id="${o._id}" ${o.status === 'Cancelled' ? 'disabled' : ''}>
            ${['Pending', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td style="font-size:12px;">${new Date(o.createdAt).toLocaleDateString()}</td>
        <td><button class="btn btn-sm btn-outline view-order-btn" data-id="${o._id}">View</button></td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async () => {
        try {
          await apiRequest(`/orders/${select.dataset.id}/status`, { method: 'PUT', body: { status: select.value } });
          showToast('Order status updated', 'success');
        } catch (err) {
          showToast(err.message, 'error');
          renderOrdersTab();
        }
      });
    });

    tbody.querySelectorAll('.view-order-btn').forEach((btn) => {
      btn.addEventListener('click', () => showAdminOrderDetail(btn.dataset.id));
    });
  } catch (err) {
    adminContent().innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

async function showAdminOrderDetail(orderId) {
  try {
    const { order } = await apiRequest(`/orders/${orderId}`);
    const itemsHtml = order.items.map((item) => `
      <div class="cart-item">
        <img src="${item.image || 'https://placehold.co/60x60?text=No+Image'}" alt="${item.name}" />
        <div class="details"><strong>${item.name}</strong><p style="font-size:12.5px; color:var(--text-light);">Qty: ${item.quantity} × ${formatPrice(item.price)}</p></div>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
      </div>
    `).join('');

    adminContent().insertAdjacentHTML('afterbegin', `
      <div class="card mb-3" id="order-detail-modal">
        <div class="flex-between mb-2">
          <h3>${order.orderNumber}</h3>
          <button class="btn btn-sm btn-outline" id="close-order-detail">Close</button>
        </div>
        <p style="font-size:13px; color:var(--text-light);">Customer: ${order.user.name} (${order.user.email})</p>
        <h4 class="mt-2 mb-1">Items</h4>
        ${itemsHtml}
        <h4 class="mt-2 mb-1">Shipping Address</h4>
        <p style="font-size:13.5px;">${order.shippingAddress.fullName}, ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
        <div class="summary-row total mt-2"><span>Total</span><span>${formatPrice(order.totalPrice)}</span></div>
      </div>
    `);

    document.getElementById('close-order-detail').addEventListener('click', () => {
      document.getElementById('order-detail-modal').remove();
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}
