// ==============================
// admin.js - Admin Panel (dashboard, products, orders, categories, brands, coupons, users)
// ==============================

const adminContent = () => document.getElementById('admin-content');

function setActiveTab(tab) {
  document.querySelectorAll('.admin-nav-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.tab === tab);
  });
}

function getTabFromHash() {
  return window.location.hash.replace('#', '') || 'dashboard';
}

async function renderAdminTab() {
  if (!requireAdmin()) return;
  const tab = getTabFromHash();
  setActiveTab(tab);
  adminContent().innerHTML = '<div class="spinner"></div>';

  switch (tab) {
    case 'dashboard': return renderDashboardTab();
    case 'products': return renderProductsTab();
    case 'orders': return renderOrdersTab();
    case 'categories': return renderCategoriesTab();
    case 'brands': return renderBrandsTab();
    case 'coupons': return renderCouponsTab();
    case 'users': return renderUsersTab();
    default: return renderDashboardTab();
  }
}

// ------------------------------
// DASHBOARD TAB
// ------------------------------
async function renderDashboardTab() {
  try {
    const { stats } = await apiRequest('/admin/dashboard');

    const statusCounts = {};
    stats.ordersByStatus.forEach((s) => (statusCounts[s._id] = s.count));

    const maxSale = Math.max(...stats.salesChart.map((s) => s.total), 1);

    adminContent().innerHTML = `
      <h2 class="mb-3">Dashboard Overview</h2>
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Total Revenue</div><div class="value">${formatPrice(stats.totalRevenue)}</div></div>
        <div class="stat-card"><div class="label">Total Orders</div><div class="value">${stats.totalOrders}</div></div>
        <div class="stat-card"><div class="label">Total Products</div><div class="value">${stats.totalProducts}</div></div>
        <div class="stat-card"><div class="label">Total Customers</div><div class="value">${stats.totalCustomers}</div></div>
      </div>

      <div style="display:grid; grid-template-columns:2fr 1fr; gap:20px; align-items:start;" class="dash-grid">
        <div class="card">
          <h3 class="mb-2">Sales - Last 7 Days</h3>
          ${stats.salesChart.length === 0 ? '<p style="color:var(--text-light); font-size:13.5px;">No sales data for this period yet.</p>' : `
            <div style="display:flex; align-items:flex-end; gap:10px; height:160px;">
              ${stats.salesChart.map((s) => `
                <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">
                  <div title="${formatPrice(s.total)}" style="width:100%; background:var(--primary); border-radius:4px 4px 0 0; height:${Math.max((s.total / maxSale) * 100, 4)}%;"></div>
                  <span style="font-size:10px; margin-top:6px; color:var(--text-light);">${s._id.slice(5)}</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="card">
          <h3 class="mb-2">Orders by Status</h3>
          ${['Pending', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((status) => `
            <div class="flex-between mb-1">
              <span class="status-badge status-${status}">${status}</span>
              <strong>${statusCounts[status] || 0}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px;" class="dash-grid">
        <div class="card">
          <h3 class="mb-2">Low Stock Products</h3>
          ${stats.lowStockProducts.length === 0 ? '<p style="color:var(--text-light); font-size:13.5px;">All products are well stocked.</p>' : `
            <table>
              <thead><tr><th>Product</th><th>Stock</th></tr></thead>
              <tbody>
                ${stats.lowStockProducts.map((p) => `<tr><td>${p.name}</td><td style="color:var(--danger); font-weight:600;">${p.stock}</td></tr>`).join('')}
              </tbody>
            </table>
          `}
        </div>

        <div class="card">
          <h3 class="mb-2">Recent Orders</h3>
          ${stats.recentOrders.length === 0 ? '<p style="color:var(--text-light); font-size:13.5px;">No orders yet.</p>' : `
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th></tr></thead>
              <tbody>
                ${stats.recentOrders.map((o) => `<tr><td>${o.orderNumber}</td><td>${o.user ? o.user.name : 'N/A'}</td><td>${formatPrice(o.totalPrice)}</td></tr>`).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
      <style>@media (max-width:800px){ .dash-grid { grid-template-columns:1fr !important; } }</style>
    `;
  } catch (err) {
    adminContent().innerHTML = `<div class="empty-state">Error loading dashboard: ${err.message}</div>`;
  }
}

window.addEventListener('hashchange', renderAdminTab);
document.addEventListener('DOMContentLoaded', renderAdminTab);
