// ==============================
// admin.js - NM Store Admin Panel
// Dashboard + Products + Orders
// Categories + Brands + Coupons + Users
// ==============================

const adminContent = () =>
  document.getElementById('admin-content');


// ==============================
// ACTIVE TAB
// ==============================

function setActiveTab(tab) {

  document
    .querySelectorAll('.admin-nav-link')
    .forEach((link) => {

      link.classList.toggle(
        'active',
        link.dataset.tab === tab
      );

    });
}


// ==============================
// GET CURRENT TAB
// ==============================

function getTabFromHash() {

  const hash =
    window.location.hash.replace('#', '').trim();

  const allowedTabs = [
    'dashboard',
    'products',
    'orders',
    'categories',
    'brands',
    'coupons',
    'users'
  ];

  return allowedTabs.includes(hash)
    ? hash
    : 'dashboard';
}


// ==============================
// LOADING STATE
// ==============================

function showAdminLoading(message = 'Loading...') {

  const content = adminContent();

  if (!content) return;

  content.innerHTML = `
    <div class="admin-loading">

      <div class="spinner"></div>

      <p>
        ${escapeHtml(message)}
      </p>

    </div>
  `;
}


// ==============================
// ERROR STATE
// ==============================

function showAdminError(message, retry = true) {

  const content = adminContent();

  if (!content) return;

  content.innerHTML = `
    <div class="empty-state admin-error">

      <div class="empty-icon">
        ⚠️
      </div>

      <h3>
        Something went wrong
      </h3>

      <p>
        ${escapeHtml(
          message || 'Unable to load this section.'
        )}
      </p>

      ${
        retry
          ? `
            <button
              class="btn btn-primary mt-2"
              type="button"
              onclick="renderAdminTab()"
            >
              Try Again
            </button>
          `
          : ''
      }

    </div>
  `;
}


// ==============================
// RENDER CURRENT TAB
// ==============================

async function renderAdminTab() {

  if (!requireAdmin()) return;

  const content = adminContent();

  if (!content) return;

  const tab = getTabFromHash();

  setActiveTab(tab);

  showAdminLoading(
    tab === 'dashboard'
      ? 'Loading dashboard...'
      : 'Loading section...'
  );


  try {

    switch (tab) {

      case 'dashboard':
        return await renderDashboardTab();

      case 'products':
        return await renderProductsTab();

      case 'orders':
        return await renderOrdersTab();

      case 'categories':
        return await renderCategoriesTab();

      case 'brands':
        return await renderBrandsTab();

      case 'coupons':
        return await renderCouponsTab();

      case 'users':
        return await renderUsersTab();

      default:
        window.location.hash = '#dashboard';
        return await renderDashboardTab();
    }

  } catch (err) {

    console.error('Admin tab error:', err);

    showAdminError(
      err.message || 'Unable to load admin section.'
    );

  }
}


// ==============================
// DASHBOARD TAB
// ==============================

async function renderDashboardTab() {

  try {

    const { stats } =
      await apiRequest('/admin/dashboard');


    if (!stats) {
      throw new Error(
        'Dashboard data is unavailable.'
      );
    }


    // ==============================
    // STATUS COUNTS
    // ==============================

    const statusCounts = {};

    (stats.ordersByStatus || [])
      .forEach((status) => {

        statusCounts[status._id] =
          status.count;

      });


    // ==============================
    // SALES DATA
    // ==============================

    const salesChart =
      Array.isArray(stats.salesChart)
        ? stats.salesChart
        : [];


    const maxSale =
      Math.max(
        ...salesChart.map(
          (sale) => Number(sale.total) || 0
        ),
        1
      );


    // ==============================
    // DASHBOARD HTML
    // ==============================

    adminContent().innerHTML = `

      <!-- ==========================
           DASHBOARD HEADER
      =========================== -->

      <div class="admin-page-header">

        <div>

          <span class="section-badge">
            📊 ADMIN DASHBOARD
          </span>

          <h1>
            Dashboard Overview
          </h1>

          <p>
            Monitor your NM Store performance,
            products, orders and customers.
          </p>

        </div>

        <div class="admin-header-date">
          📅 ${new Date().toLocaleDateString(
            undefined,
            {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }
          )}
        </div>

      </div>


      <!-- ==========================
           STAT CARDS
      =========================== -->

      <div class="stat-grid admin-stat-grid">


        <!-- Revenue -->

        <div class="stat-card admin-stat-card">

          <div class="admin-stat-icon">
            💰
          </div>

          <div class="label">
            Total Revenue
          </div>

          <div class="value">
            ${formatPrice(
              Number(stats.totalRevenue) || 0
            )}
          </div>

          <span class="admin-stat-note">
            Overall sales
          </span>

        </div>


        <!-- Orders -->

        <div class="stat-card admin-stat-card">

          <div class="admin-stat-icon">
            🧾
          </div>

          <div class="label">
            Total Orders
          </div>

          <div class="value">
            ${Number(stats.totalOrders) || 0}
          </div>

          <span class="admin-stat-note">
            Orders received
          </span>

        </div>


        <!-- Products -->

        <div class="stat-card admin-stat-card">

          <div class="admin-stat-icon">
            📦
          </div>

          <div class="label">
            Total Products
          </div>

          <div class="value">
            ${Number(stats.totalProducts) || 0}
          </div>

          <span class="admin-stat-note">
            Products in store
          </span>

        </div>


        <!-- Customers -->

        <div class="stat-card admin-stat-card">

          <div class="admin-stat-icon">
            👥
          </div>

          <div class="label">
            Total Customers
          </div>

          <div class="value">
            ${Number(stats.totalCustomers) || 0}
          </div>

          <span class="admin-stat-note">
            Registered users
          </span>

        </div>

      </div>


      <!-- ==========================
           SALES + STATUS
      =========================== -->

      <div class="admin-dashboard-grid">


        <!-- SALES -->

        <section class="card admin-dashboard-card">

          <div class="admin-card-header">

            <div>

              <h3>
                Sales Performance
              </h3>

              <p>
                Last 7 days
              </p>

            </div>

            <span class="admin-card-icon">
              📈
            </span>

          </div>


          ${
            salesChart.length === 0
              ? `
                <div class="admin-no-data">
                  <span>📊</span>
                  <p>
                    No sales data for this period yet.
                  </p>
                </div>
              `
              : `
                <div
                  class="sales-chart"
                  aria-label="Sales chart"
                >

                  ${salesChart
                    .map((sale) => {

                      const total =
                        Number(sale.total) || 0;

                      const height =
                        Math.max(
                          (total / maxSale) * 100,
                          5
                        );

                      const label =
                        sale._id
                          ? String(
                              sale._id
                            ).slice(5)
                          : '';

                      return `
                        <div class="sales-bar-column">

                          <div
                            class="sales-tooltip"
                          >
                            ${formatPrice(total)}
                          </div>

                          <div
                            class="sales-bar"
                            style="
                              height:${height}%;
                            "
                            title="${formatPrice(total)}"
                          ></div>

                          <span>
                            ${escapeHtml(label)}
                          </span>

                        </div>
                      `;

                    })
                    .join('')}

                </div>
              `
          }

        </section>


        <!-- ORDER STATUS -->

        <section class="card admin-dashboard-card">

          <div class="admin-card-header">

            <div>

              <h3>
                Orders by Status
              </h3>

              <p>
                Current order distribution
              </p>

            </div>

            <span class="admin-card-icon">
              📋
            </span>

          </div>


          <div class="status-list">

            ${[
              'Pending',
              'Packed',
              'Shipped',
              'Delivered',
              'Cancelled'
            ]
              .map((status) => {

                const count =
                  statusCounts[status] || 0;

                return `
                  <div class="admin-status-row">

                    <span
                      class="status-badge status-${status}"
                    >
                      ${status}
                    </span>

                    <strong>
                      ${count}
                    </strong>

                  </div>
                `;

              })
              .join('')}

          </div>

        </section>

      </div>


      <!-- ==========================
           LOW STOCK + RECENT ORDERS
      =========================== -->

      <div class="admin-dashboard-grid">


        <!-- LOW STOCK -->

        <section class="card admin-dashboard-card">

          <div class="admin-card-header">

            <div>

              <h3>
                Low Stock Products
              </h3>

              <p>
                Products that need attention
              </p>

            </div>

            <span class="admin-card-icon">
              ⚠️
            </span>

          </div>


          ${
            !stats.lowStockProducts ||
            stats.lowStockProducts.length === 0

              ? `
                <div class="admin-no-data">
                  <span>✅</span>

                  <p>
                    All products are well stocked.
                  </p>
                </div>
              `

              : `
                <div class="admin-table-wrapper">

                  <table>

                    <thead>

                      <tr>
                        <th>Product</th>
                        <th>Stock</th>
                      </tr>

                    </thead>

                    <tbody>

                      ${stats.lowStockProducts
                        .map((product) => `

                          <tr>

                            <td>
                              <strong>
                                ${escapeHtml(
                                  product.name || 'N/A'
                                )}
                              </strong>
                            </td>

                            <td>

                              <span class="stock-warning">
                                ${Number(
                                  product.stock
                                ) || 0}
                                left
                              </span>

                            </td>

                          </tr>

                        `)
                        .join('')}

                    </tbody>

                  </table>

                </div>
              `
          }

        </section>


        <!-- RECENT ORDERS -->

        <section class="card admin-dashboard-card">

          <div class="admin-card-header">

            <div>

              <h3>
                Recent Orders
              </h3>

              <p>
                Latest customer purchases
              </p>

            </div>

            <span class="admin-card-icon">
              🧾
            </span>

          </div>


          ${
            !stats.recentOrders ||
            stats.recentOrders.length === 0

              ? `
                <div class="admin-no-data">

                  <span>📦</span>

                  <p>
                    No orders yet.
                  </p>

                </div>
              `

              : `
                <div class="admin-table-wrapper">

                  <table>

                    <thead>

                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Total</th>
                      </tr>

                    </thead>

                    <tbody>

                      ${stats.recentOrders
                        .map((order) => `

                          <tr>

                            <td>
                              <strong>
                                ${escapeHtml(
                                  order.orderNumber || 'N/A'
                                )}
                              </strong>
                            </td>

                            <td>
                              ${escapeHtml(
                                order.user?.name ||
                                'N/A'
                              )}
                            </td>

                            <td>
                              <strong>
                                ${formatPrice(
                                  order.totalPrice
                                )}
                              </strong>
                            </td>

                          </tr>

                        `)
                        .join('')}

                    </tbody>

                  </table>

                </div>
              `
          }

        </section>

      </div>


      <!-- ==========================
           QUICK ACTIONS
      =========================== -->

      <section class="card admin-quick-actions">

        <div class="admin-card-header">

          <div>

            <h3>
              Quick Actions
            </h3>

            <p>
              Manage your store quickly
            </p>

          </div>

          <span class="admin-card-icon">
            ⚡
          </span>

        </div>


        <div class="quick-action-grid">

          <a
            href="#products"
            class="quick-action"
          >
            <span>📦</span>
            <strong>Manage Products</strong>
            <small>Add, edit or remove products</small>
          </a>


          <a
            href="#orders"
            class="quick-action"
          >
            <span>🧾</span>
            <strong>Manage Orders</strong>
            <small>View and update orders</small>
          </a>


          <a
            href="#categories"
            class="quick-action"
          >
            <span>🗂️</span>
            <strong>Categories</strong>
            <small>Organize your catalog</small>
          </a>


          <a
            href="#coupons"
            class="quick-action"
          >
            <span>🎟️</span>
            <strong>Coupons</strong>
            <small>Manage promotional offers</small>
          </a>

        </div>

      </section>

    `;

  } catch (err) {

    console.error(
      'Dashboard error:',
      err
    );

    showAdminError(
      `Error loading dashboard: ${
        err.message || 'Unknown error'
      }`
    );

  }
}


// ==============================
// HASH CHANGE
// ==============================

window.addEventListener(
  'hashchange',
  renderAdminTab
);


// ==============================
// INITIALIZE
// ==============================

document.addEventListener(
  'DOMContentLoaded',
  renderAdminTab
);