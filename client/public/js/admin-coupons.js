// ==============================
// admin-coupons.js - NM Store Admin Coupons
// ==============================

async function renderCouponsTab() {
  try {
    const response = await apiRequest('/coupons');
    const coupons = Array.isArray(response?.coupons) ? response.coupons : [];

    adminContent().innerHTML = `
      <section class="admin-page">
        <div class="admin-page-header">
          <div>
            <span class="admin-eyebrow">PROMOTIONS</span>
            <h1>Coupons</h1>
            <p>Create and manage discount coupons for NM Store.</p>
          </div>

          <button class="btn btn-primary" id="add-coupon-btn">
            <span>＋</span> Add Coupon
          </button>
        </div>

        <div class="admin-stat-grid coupon-stats">
          <div class="admin-stat-card">
            <div class="admin-stat-icon">🎟️</div>
            <div>
              <span>Total Coupons</span>
              <strong>${coupons.length}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon">✅</div>
            <div>
              <span>Active</span>
              <strong>${coupons.filter(c => c.isActive).length}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon">⏳</div>
            <div>
              <span>Expired</span>
              <strong>${coupons.filter(c => isCouponExpired(c)).length}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon">🔥</div>
            <div>
              <span>Total Used</span>
              <strong>${coupons.reduce((sum, c) => sum + Number(c.usedCount || 0), 0)}</strong>
            </div>
          </div>
        </div>

        <div id="coupon-form-wrap"></div>

        <div class="card admin-table-card">
          <div class="admin-table-header">
            <div>
              <h3>All Coupons</h3>
              <p>${coupons.length} coupon${coupons.length === 1 ? '' : 's'} available</p>
            </div>

            <div class="admin-table-search">
              <input
                type="search"
                id="coupon-search"
                placeholder="Search coupon code..."
                aria-label="Search coupons"
              />
            </div>
          </div>

          <div class="table-responsive">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Coupon</th>
                  <th>Discount</th>
                  <th>Min Purchase</th>
                  <th>Expiry</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody id="admin-coupons-tbody"></tbody>
            </table>
          </div>
        </div>
      </section>
    `;

    const tbody = document.getElementById('admin-coupons-tbody');

    function renderCouponRows(list) {
      if (!list.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7">
              <div class="admin-empty-table">
                <div class="admin-empty-icon">🎟️</div>
                <h3>No coupons found</h3>
                <p>Create your first coupon to start offering discounts.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = list.map((coupon) => {
        const expired = isCouponExpired(coupon);
        const active = Boolean(coupon.isActive) && !expired;

        const discount = coupon.discountType === 'percentage'
          ? `${Number(coupon.discountValue || 0)}%`
          : formatPrice(coupon.discountValue || 0);

        const usageLimit = Number(coupon.usageLimit || 0);
        const usedCount = Number(coupon.usedCount || 0);

        const usageText = usageLimit > 0
          ? `${usedCount} / ${usageLimit}`
          : `${usedCount} / ∞`;

        const expiryText = coupon.expiresAt
          ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })
          : 'No expiry';

        return `
          <tr>
            <td>
              <div class="coupon-code-cell">
                <div class="coupon-icon">%</div>
                <div>
                  <strong>${escapeCouponHTML(coupon.code || '')}</strong>
                  <small>
                    ${coupon.discountType === 'percentage'
                      ? 'Percentage discount'
                      : 'Flat discount'}
                  </small>
                </div>
              </div>
            </td>

            <td>
              <strong class="coupon-discount">${discount}</strong>
              ${
                coupon.discountType === 'percentage' &&
                Number(coupon.maxDiscount || 0) > 0
                  ? `<small class="table-subtext">Max ${formatPrice(coupon.maxDiscount)}</small>`
                  : ''
              }
            </td>

            <td>
              ${formatPrice(coupon.minPurchase || 0)}
            </td>

            <td>
              <span class="${expired ? 'text-danger' : ''}">
                ${expiryText}
              </span>
            </td>

            <td>
              <span class="usage-badge">
                ${usageText}
              </span>
            </td>

            <td>
              ${
                active
                  ? `<span class="status-badge status-active">Active</span>`
                  : expired
                    ? `<span class="status-badge status-expired">Expired</span>`
                    : `<span class="status-badge status-inactive">Inactive</span>`
              }
            </td>

            <td>
              <div class="admin-action-buttons">
                <button
                  class="btn btn-sm btn-outline edit-coupon-btn"
                  data-id="${coupon._id}"
                  title="Edit coupon"
                >
                  Edit
                </button>

                <button
                  class="btn btn-sm btn-danger delete-coupon-btn"
                  data-id="${coupon._id}"
                  title="Delete coupon"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      bindCouponActions(list);
    }

    renderCouponRows(coupons);

    const searchInput = document.getElementById('coupon-search');

    searchInput?.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();

      const filtered = coupons.filter((coupon) =>
        String(coupon.code || '').toLowerCase().includes(query)
      );

      renderCouponRows(filtered);
    });

    document
      .getElementById('add-coupon-btn')
      ?.addEventListener('click', () => {
        showCouponForm(null);
      });

    function bindCouponActions(list) {
      tbody.querySelectorAll('.edit-coupon-btn').forEach((button) => {
        button.addEventListener('click', () => {
          const coupon = list.find(
            (item) => String(item._id) === String(button.dataset.id)
          );

          if (coupon) {
            showCouponForm(coupon);
          }
        });
      });

      tbody.querySelectorAll('.delete-coupon-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          const coupon = list.find(
            (item) => String(item._id) === String(button.dataset.id)
          );

          const code = coupon?.code || 'this coupon';

          if (!confirmAction(`Delete coupon "${code}"?`)) {
            return;
          }

          try {
            await apiRequest(`/coupons/${button.dataset.id}`, {
              method: 'DELETE'
            });

            showToast('Coupon deleted successfully', 'success');
            renderCouponsTab();
          } catch (err) {
            showToast(err.message || 'Failed to delete coupon', 'error');
          }
        });
      });
    }

  } catch (err) {
    adminContent().innerHTML = `
      <section class="admin-page">
        <div class="admin-error">
          <div class="admin-error-icon">⚠️</div>
          <h2>Unable to load coupons</h2>
          <p>${escapeCouponHTML(err.message || 'Something went wrong.')}</p>
          <button class="btn btn-primary" onclick="renderCouponsTab()">
            Try Again
          </button>
        </div>
      </section>
    `;
  }
}


// ==============================
// Coupon Form
// ==============================

function showCouponForm(coupon) {
  const isEdit = Boolean(coupon);
  const wrap = document.getElementById('coupon-form-wrap');

  if (!wrap) return;

  const expiresValue = coupon?.expiresAt
    ? new Date(coupon.expiresAt).toISOString().slice(0, 10)
    : '';

  wrap.innerHTML = `
    <div class="card coupon-form-card">
      <div class="coupon-form-header">
        <div>
          <span class="admin-eyebrow">COUPON SETTINGS</span>
          <h2>${isEdit ? 'Edit Coupon' : 'Create Coupon'}</h2>
          <p>
            ${
              isEdit
                ? 'Update the coupon details below.'
                : 'Create a new discount coupon for your customers.'
            }
          </p>
        </div>

        <button
          type="button"
          class="admin-close-btn"
          id="cancel-coupon-form"
          aria-label="Close coupon form"
        >
          ×
        </button>
      </div>

      <form id="coupon-form">

        <div class="coupon-form-grid">

          <div class="form-group">
            <label for="cp-code">Coupon Code</label>
            <input
              type="text"
              id="cp-code"
              required
              maxlength="30"
              autocomplete="off"
              placeholder="e.g. SAVE20"
              value="${escapeCouponHTML(coupon?.code || '')}"
              style="text-transform:uppercase;"
            />
            <small>Customers will enter this code at checkout.</small>
          </div>

          <div class="form-group">
            <label for="cp-type">Discount Type</label>

            <select id="cp-type">
              <option
                value="percentage"
                ${!isEdit || coupon.discountType === 'percentage' ? 'selected' : ''}
              >
                Percentage (%)
              </option>

              <option
                value="flat"
                ${isEdit && coupon.discountType === 'flat' ? 'selected' : ''}
              >
                Flat Amount (₹)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="cp-value">Discount Value</label>

            <input
              type="number"
              id="cp-value"
              min="0"
              step="0.01"
              required
              placeholder="20"
              value="${isEdit ? Number(coupon.discountValue || 0) : ''}"
            />
          </div>

          <div class="form-group">
            <label for="cp-max">
              Maximum Discount
              <span class="optional-label">(optional)</span>
            </label>

            <input
              type="number"
              id="cp-max"
              min="0"
              step="0.01"
              placeholder="500"
              value="${isEdit ? Number(coupon.maxDiscount || 0) : ''}"
            />

            <small>Useful for percentage coupons.</small>
          </div>

          <div class="form-group">
            <label for="cp-min">Minimum Purchase (₹)</label>

            <input
              type="number"
              id="cp-min"
              min="0"
              step="0.01"
              placeholder="1000"
              value="${isEdit ? Number(coupon.minPurchase || 0) : 0}"
            />
          </div>

          <div class="form-group">
            <label for="cp-limit">Usage Limit</label>

            <input
              type="number"
              id="cp-limit"
              min="0"
              step="1"
              placeholder="100"
              value="${isEdit ? Number(coupon.usageLimit || 0) : 0}"
            />

            <small>Enter 0 for unlimited usage.</small>
          </div>

          <div class="form-group">
            <label for="cp-expires">Expiry Date</label>

            <input
              type="date"
              id="cp-expires"
              required
              value="${expiresValue}"
            />
          </div>

          <div class="form-group coupon-active-field">
            <label class="coupon-checkbox">
              <input
                type="checkbox"
                id="cp-active"
                ${!isEdit || coupon.isActive ? 'checked' : ''}
              />

              <span>
                <strong>Active Coupon</strong>
                <small>Allow customers to use this coupon.</small>
              </span>
            </label>
          </div>

        </div>

        <div class="coupon-preview">
          <div class="coupon-preview-left">
            <div class="coupon-preview-icon">%</div>

            <div>
              <span>Customer Preview</span>
              <strong id="coupon-preview-code">
                ${escapeCouponHTML(coupon?.code || 'YOURCODE')}
              </strong>
            </div>
          </div>

          <div class="coupon-preview-value" id="coupon-preview-value">
            ${
              isEdit
                ? coupon.discountType === 'percentage'
                  ? `${Number(coupon.discountValue || 0)}% OFF`
                  : `${formatPrice(coupon.discountValue || 0)} OFF`
                : '20% OFF'
            }
          </div>
        </div>

        <div class="coupon-form-actions">
          <button type="submit" class="btn btn-primary">
            ${isEdit ? 'Save Changes' : 'Create Coupon'}
          </button>

          <button
            type="button"
            class="btn btn-outline"
            id="cancel-coupon-form-bottom"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  `;

  const closeForm = () => {
    wrap.innerHTML = '';
  };

  document
    .getElementById('cancel-coupon-form')
    ?.addEventListener('click', closeForm);

  document
    .getElementById('cancel-coupon-form-bottom')
    ?.addEventListener('click', closeForm);

  setupCouponPreview();

  document
    .getElementById('coupon-form')
    ?.addEventListener('submit', async (event) => {
      event.preventDefault();

      const code = document
        .getElementById('cp-code')
        .value
        .trim()
        .toUpperCase();

      const discountType = document.getElementById('cp-type').value;

      const discountValue = Number(
        document.getElementById('cp-value').value
      );

      const maxDiscount = Number(
        document.getElementById('cp-max').value
      ) || 0;

      const minPurchase = Number(
        document.getElementById('cp-min').value
      ) || 0;

      const usageLimit = Number(
        document.getElementById('cp-limit').value
      ) || 0;

      const expiresAt =
        document.getElementById('cp-expires').value;

      const isActive =
        document.getElementById('cp-active').checked;

      // ------------------------------
      // Validation
      // ------------------------------

      if (!code) {
        showToast('Please enter a coupon code', 'error');
        return;
      }

      if (!/^[A-Z0-9_-]+$/.test(code)) {
        showToast(
          'Coupon code can contain only letters, numbers, _ and -',
          'error'
        );
        return;
      }

      if (discountValue <= 0) {
        showToast('Discount value must be greater than 0', 'error');
        return;
      }

      if (discountType === 'percentage' && discountValue > 100) {
        showToast('Percentage discount cannot exceed 100%', 'error');
        return;
      }

      if (maxDiscount < 0) {
        showToast('Maximum discount cannot be negative', 'error');
        return;
      }

      if (minPurchase < 0) {
        showToast('Minimum purchase cannot be negative', 'error');
        return;
      }

      if (usageLimit < 0) {
        showToast('Usage limit cannot be negative', 'error');
        return;
      }

      if (!expiresAt) {
        showToast('Please select an expiry date', 'error');
        return;
      }

      const expiryDate = new Date(`${expiresAt}T23:59:59`);

      if (expiryDate < new Date()) {
        showToast('Expiry date must be in the future', 'error');
        return;
      }

      const body = {
        code,
        discountType,
        discountValue,
        maxDiscount,
        minPurchase,
        usageLimit,
        expiresAt,
        isActive
      };

      const submitButton = document.querySelector(
        '#coupon-form button[type="submit"]'
      );

      const originalText = submitButton?.innerHTML;

      try {
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.innerHTML = `
            <span class="spinner spinner-sm"></span>
            ${isEdit ? 'Saving...' : 'Creating...'}
          `;
        }

        if (isEdit) {
          await apiRequest(`/coupons/${coupon._id}`, {
            method: 'PUT',
            body
          });

          showToast('Coupon updated successfully', 'success');
        } else {
          await apiRequest('/coupons', {
            method: 'POST',
            body
          });

          showToast('Coupon created successfully', 'success');
        }

        renderCouponsTab();

      } catch (err) {
        showToast(
          err.message || 'Unable to save coupon',
          'error'
        );

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalText;
        }
      }
    });
}


// ==============================
// Coupon Preview
// ==============================

function setupCouponPreview() {
  const codeInput = document.getElementById('cp-code');
  const typeInput = document.getElementById('cp-type');
  const valueInput = document.getElementById('cp-value');

  const previewCode =
    document.getElementById('coupon-preview-code');

  const previewValue =
    document.getElementById('coupon-preview-value');

  const updatePreview = () => {
    const code =
      codeInput?.value.trim().toUpperCase() || 'YOURCODE';

    const type = typeInput?.value || 'percentage';

    const value = Number(valueInput?.value || 0);

    if (previewCode) {
      previewCode.textContent = code;
    }

    if (previewValue) {
      previewValue.textContent =
        type === 'percentage'
          ? `${value || 0}% OFF`
          : `${formatPrice(value || 0)} OFF`;
    }
  };

  codeInput?.addEventListener('input', updatePreview);
  typeInput?.addEventListener('change', updatePreview);
  valueInput?.addEventListener('input', updatePreview);

  updatePreview();
}


// ==============================
// Helpers
// ==============================

function isCouponExpired(coupon) {
  if (!coupon?.expiresAt) return false;

  return new Date(coupon.expiresAt).getTime() < Date.now();
}


function escapeCouponHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}