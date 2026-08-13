// ==============================
// admin-coupons.js - Admin Coupons Tab
// ==============================

async function renderCouponsTab() {
  try {
    const { coupons } = await apiRequest('/coupons');

    adminContent().innerHTML = `
      <div class="flex-between mb-3">
        <h2>Manage Coupons</h2>
        <button class="btn btn-primary" id="add-coupon-btn">+ Add Coupon</button>
      </div>
      <div id="coupon-form-wrap"></div>
      <div class="card" style="overflow-x:auto;">
        <table>
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Purchase</th><th>Expires</th><th>Used</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody id="admin-coupons-tbody"></tbody>
        </table>
      </div>
    `;

    const tbody = document.getElementById('admin-coupons-tbody');
    tbody.innerHTML = coupons.length === 0
      ? '<tr><td colspan="8">No coupons yet.</td></tr>'
      : coupons.map((c) => `
        <tr>
          <td><strong>${c.code}</strong></td>
          <td>${c.discountType}</td>
          <td>${c.discountType === 'percentage' ? c.discountValue + '%' : formatPrice(c.discountValue)}</td>
          <td>${formatPrice(c.minPurchase)}</td>
          <td>${new Date(c.expiresAt).toLocaleDateString()}</td>
          <td>${c.usedCount}${c.usageLimit > 0 ? ' / ' + c.usageLimit : ''}</td>
          <td>${c.isActive ? '✅' : '—'}</td>
          <td>
            <button class="btn btn-sm btn-outline edit-coupon-btn" data-id="${c._id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-coupon-btn" data-id="${c._id}">Delete</button>
          </td>
        </tr>
      `).join('');

    tbody.querySelectorAll('.edit-coupon-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const coupon = coupons.find((c) => c._id === btn.dataset.id);
        showCouponForm(coupon);
      });
    });
    tbody.querySelectorAll('.delete-coupon-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirmAction('Delete this coupon?')) return;
        try {
          await apiRequest(`/coupons/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('Coupon deleted', 'success');
          renderCouponsTab();
        } catch (err) { showToast(err.message, 'error'); }
      });
    });

    document.getElementById('add-coupon-btn').addEventListener('click', () => showCouponForm(null));
  } catch (err) {
    adminContent().innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

function showCouponForm(coupon) {
  const isEdit = !!coupon;
  const wrap = document.getElementById('coupon-form-wrap');
  const expiresValue = isEdit ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '';

  wrap.innerHTML = `
    <div class="card mb-3">
      <h3 class="mb-2">${isEdit ? 'Edit Coupon' : 'Add Coupon'}</h3>
      <form id="coupon-form">
        <div class="flex" style="gap:12px;">
          <div class="form-group" style="flex:1;"><label>Coupon Code</label><input type="text" id="cp-code" required value="${isEdit ? coupon.code : ''}" style="text-transform:uppercase;" /></div>
          <div class="form-group" style="flex:1;">
            <label>Discount Type</label>
            <select id="cp-type">
              <option value="percentage" ${isEdit && coupon.discountType === 'percentage' ? 'selected' : ''}>Percentage</option>
              <option value="flat" ${isEdit && coupon.discountType === 'flat' ? 'selected' : ''}>Flat Amount</option>
            </select>
          </div>
        </div>
        <div class="flex" style="gap:12px;">
          <div class="form-group" style="flex:1;"><label>Discount Value</label><input type="number" id="cp-value" min="0" required value="${isEdit ? coupon.discountValue : ''}" /></div>
          <div class="form-group" style="flex:1;"><label>Max Discount (for %, optional)</label><input type="number" id="cp-max" min="0" value="${isEdit ? coupon.maxDiscount : ''}" /></div>
        </div>
        <div class="flex" style="gap:12px;">
          <div class="form-group" style="flex:1;"><label>Min Purchase (₹)</label><input type="number" id="cp-min" min="0" value="${isEdit ? coupon.minPurchase : 0}" /></div>
          <div class="form-group" style="flex:1;"><label>Usage Limit (0 = unlimited)</label><input type="number" id="cp-limit" min="0" value="${isEdit ? coupon.usageLimit : 0}" /></div>
        </div>
        <div class="form-group"><label>Expiry Date</label><input type="date" id="cp-expires" required value="${expiresValue}" /></div>
        <div class="form-group">
          <label style="display:flex; align-items:center; gap:8px; font-weight:400;">
            <input type="checkbox" id="cp-active" style="width:auto;" ${!isEdit || coupon.isActive ? 'checked' : ''} /> Active
          </label>
        </div>
        <div class="flex" style="gap:10px;">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
          <button type="button" class="btn btn-outline" id="cancel-coupon-form">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById('cancel-coupon-form').addEventListener('click', () => (wrap.innerHTML = ''));

  document.getElementById('coupon-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      code: document.getElementById('cp-code').value.trim().toUpperCase(),
      discountType: document.getElementById('cp-type').value,
      discountValue: Number(document.getElementById('cp-value').value),
      maxDiscount: Number(document.getElementById('cp-max').value) || 0,
      minPurchase: Number(document.getElementById('cp-min').value) || 0,
      usageLimit: Number(document.getElementById('cp-limit').value) || 0,
      expiresAt: document.getElementById('cp-expires').value,
      isActive: document.getElementById('cp-active').checked,
    };

    try {
      if (isEdit) {
        await apiRequest(`/coupons/${coupon._id}`, { method: 'PUT', body });
        showToast('Coupon updated', 'success');
      } else {
        await apiRequest('/coupons', { method: 'POST', body });
        showToast('Coupon created', 'success');
      }
      renderCouponsTab();
    } catch (err) { showToast(err.message, 'error'); }
  });
}
