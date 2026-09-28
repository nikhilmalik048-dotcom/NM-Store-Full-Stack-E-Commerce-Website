// ==============================
// admin-orders.js
// NM Store - Admin Order Management
// ==============================


// ==============================
// RENDER ORDERS TAB
// ==============================

async function renderOrdersTab() {

  try {

    const { orders } =
      await apiRequest('/orders?limit=100');


    const orderList =
      Array.isArray(orders)
        ? orders
        : [];


    adminContent().innerHTML = `

      <!-- ==========================
           PAGE HEADER
      =========================== -->

      <div class="admin-page-header">

        <div>

          <span class="section-badge">
            🧾 ORDER MANAGEMENT
          </span>

          <h1>
            Manage Orders
          </h1>

          <p>
            View customer orders and update
            their delivery status.
          </p>

        </div>


        <div class="admin-order-count">

          <span>
            🧾
          </span>

          <div>

            <strong>
              ${orderList.length}
            </strong>

            <small>
              Orders loaded
            </small>

          </div>

        </div>

      </div>


      <!-- ==========================
           ORDER TABLE
      =========================== -->

      <div class="card admin-orders-card">

        <div class="admin-card-header">

          <div>

            <h3>
              All Orders
            </h3>

            <p>
              Manage recent customer purchases
            </p>

          </div>

          <span class="admin-card-icon">
            📋
          </span>

        </div>


        <div class="admin-table-wrapper">

          <table class="admin-orders-table">

            <thead>

              <tr>

                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>

              </tr>

            </thead>

            <tbody id="admin-orders-tbody"></tbody>

          </table>

        </div>

      </div>

    `;


    renderAdminOrdersTable(orderList);


  } catch (err) {

    console.error(
      'Admin orders error:',
      err
    );


    adminContent().innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h3>
          Unable to load orders
        </h3>

        <p>
          ${escapeHtml(
            err.message ||
            'Something went wrong.'
          )}
        </p>

        <button
          class="btn btn-primary mt-2"
          type="button"
          onclick="renderOrdersTab()"
        >
          Try Again
        </button>

      </div>

    `;

  }

}


// ==============================
// RENDER ORDERS TABLE
// ==============================

function renderAdminOrdersTable(orders) {

  const tbody =
    document.getElementById(
      'admin-orders-tbody'
    );

  if (!tbody) return;


  if (!orders.length) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="7"
          class="admin-table-empty"
        >

          <div class="admin-no-data">

            <span>
              📦
            </span>

            <h3>
              No orders yet
            </h3>

            <p>
              Customer orders will appear here
              after they place an order.
            </p>

          </div>

        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML = orders
    .map((order) => {

      const statusClass =
        String(order.status || '')
          .toLowerCase()
          .replace(/\s+/g, '-');


      const itemCount =
        order.items?.reduce(
          (total, item) =>
            total +
            Number(item.quantity || 0),
          0
        ) || 0;


      const customerName =
        order.user?.name || 'N/A';

      const customerEmail =
        order.user?.email || '';


      return `

        <tr>

          <!-- ORDER -->

          <td>

            <div class="admin-order-number">

              <strong>
                ${escapeHtml(
                  order.orderNumber || 'N/A'
                )}
              </strong>

              <small>
                #${String(
                  order._id || ''
                ).slice(-6)}
              </small>

            </div>

          </td>


          <!-- CUSTOMER -->

          <td>

            <div class="admin-customer">

              <div class="admin-customer-avatar">
                ${escapeHtml(
                  customerName
                    .charAt(0)
                    .toUpperCase()
                )}
              </div>

              <div>

                <strong>
                  ${escapeHtml(
                    customerName
                  )}
                </strong>

                <small>
                  ${escapeHtml(
                    customerEmail
                  )}
                </small>

              </div>

            </div>

          </td>


          <!-- ITEMS -->

          <td>

            <span class="admin-items-count">
              📦 ${itemCount}
            </span>

          </td>


          <!-- TOTAL -->

          <td>

            <strong class="admin-order-total">
              ${formatPrice(
                order.totalPrice
              )}
            </strong>

          </td>


          <!-- STATUS -->

          <td>

            <select
              class="status-select admin-status-select status-${statusClass}"
              data-id="${order._id}"
              ${
                order.status === 'Cancelled'
                  ? 'disabled'
                  : ''
              }
            >

              ${[
                'Pending',
                'Packed',
                'Shipped',
                'Delivered',
                'Cancelled'
              ]
                .map(
                  (status) => `
                    <option
                      value="${status}"
                      ${
                        order.status === status
                          ? 'selected'
                          : ''
                      }
                    >
                      ${status}
                    </option>
                  `
                )
                .join('')}

            </select>

          </td>


          <!-- DATE -->

          <td>

            <span class="admin-order-date">

              ${new Date(
                order.createdAt
              ).toLocaleDateString(
                undefined,
                {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                }
              )}

            </span>

          </td>


          <!-- ACTION -->

          <td>

            <button
              class="btn btn-sm btn-outline view-order-btn"
              data-id="${order._id}"
              type="button"
            >
              View →
            </button>

          </td>

        </tr>

      `;

    })
    .join('');


  // ==============================
  // STATUS UPDATE
  // ==============================

  tbody
    .querySelectorAll(
      '.status-select'
    )
    .forEach((select) => {

      select.addEventListener(
        'change',
        async () => {

          const newStatus =
            select.value;

          const orderId =
            select.dataset.id;


          select.disabled = true;


          try {

            await apiRequest(
              `/orders/${orderId}/status`,
              {
                method: 'PUT',
                body: {
                  status: newStatus
                }
              }
            );


            showToast(
              'Order status updated successfully',
              'success'
            );


            select.className =
              `status-select admin-status-select status-${
                newStatus
                  .toLowerCase()
                  .replace(/\s+/g, '-')
              }`;


            if (
              newStatus === 'Cancelled'
            ) {

              select.disabled = true;

            } else {

              select.disabled = false;

            }


          } catch (err) {

            showToast(
              err.message ||
              'Unable to update order status',
              'error'
            );


            await renderOrdersTab();

          }

        }
      );

    });


  // ==============================
  // VIEW ORDER
  // ==============================

  tbody
    .querySelectorAll(
      '.view-order-btn'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          showAdminOrderDetail(
            button.dataset.id
          );

        }
      );

    });

}


// ==============================
// ADMIN ORDER DETAIL
// ==============================

async function showAdminOrderDetail(
  orderId
) {

  try {

    const { order } =
      await apiRequest(
        `/orders/${orderId}`
      );


    const itemsHtml =
      (order.items || [])
        .map((item) => {

          const image =
            item.image ||
            'https://placehold.co/80x80?text=No+Image';


          const quantity =
            Number(item.quantity) || 0;


          const itemTotal =
            Number(item.price || 0) *
            quantity;


          return `

            <div class="admin-order-item">

              <div class="admin-order-item-image">

                <img
                  src="${escapeHtml(image)}"
                  alt="${escapeHtml(
                    item.name || 'Product'
                  )}"
                />

              </div>


              <div class="admin-order-item-info">

                <strong>
                  ${escapeHtml(
                    item.name || 'Product'
                  )}
                </strong>

                <span>
                  Qty: ${quantity}
                </span>

                <span>
                  ${formatPrice(
                    item.price
                  )} each
                </span>

              </div>


              <strong class="admin-order-item-total">
                ${formatPrice(itemTotal)}
              </strong>

            </div>

          `;

        })
        .join('');


    const address =
      order.shippingAddress || {};


    const customer =
      order.user || {};


    const statusClass =
      String(order.status || '')
        .toLowerCase()
        .replace(/\s+/g, '-');


    // ==============================
    // DETAIL PANEL
    // ==============================

    const existing =
      document.getElementById(
        'order-detail-modal'
      );

    if (existing) {
      existing.remove();
    }


    adminContent().insertAdjacentHTML(
      'afterbegin',
      `

        <div
          class="card admin-order-detail-modal"
          id="order-detail-modal"
        >


          <!-- HEADER -->

          <div class="admin-detail-header">

            <div>

              <span class="section-badge">
                🧾 ORDER DETAILS
              </span>

              <h2>
                ${escapeHtml(
                  order.orderNumber ||
                  'Order'
                )}
              </h2>

              <p>
                Placed on
                ${new Date(
                  order.createdAt
                ).toLocaleString()}
              </p>

            </div>


            <div class="admin-detail-header-actions">

              <span
                class="status-badge status-${statusClass}"
              >
                ${escapeHtml(
                  order.status ||
                  'Unknown'
                )}
              </span>


              <button
                class="btn btn-sm btn-outline"
                id="close-order-detail"
                type="button"
              >
                ✕ Close
              </button>

            </div>

          </div>


          <!-- CUSTOMER -->

          <div class="admin-detail-grid">


            <div class="admin-detail-info-card">

              <span class="detail-card-icon">
                👤
              </span>

              <div>

                <small>
                  Customer
                </small>

                <strong>
                  ${escapeHtml(
                    customer.name ||
                    'N/A'
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    customer.email ||
                    ''
                  )}
                </span>

              </div>

            </div>


            <div class="admin-detail-info-card">

              <span class="detail-card-icon">
                💳
              </span>

              <div>

                <small>
                  Payment
                </small>

                <strong>
                  ${escapeHtml(
                    order.paymentMethod ||
                    'N/A'
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    order.paymentStatus ||
                    'N/A'
                  )}
                </span>

              </div>

            </div>


          </div>


          <!-- ITEMS -->

          <div class="admin-detail-section">

            <div class="admin-detail-section-header">

              <h3>
                📦 Order Items
              </h3>

              <span>
                ${(order.items || []).length}
                ${
                  (order.items || []).length === 1
                    ? 'item'
                    : 'items'
                }
              </span>

            </div>


            <div class="admin-order-items">

              ${
                itemsHtml ||
                `
                  <p class="text-muted">
                    No items found.
                  </p>
                `
              }

            </div>

          </div>


          <!-- SHIPPING -->

          <div class="admin-detail-section">

            <div class="admin-detail-section-header">

              <h3>
                🚚 Shipping Address
              </h3>

            </div>


            <div class="admin-shipping-address">

              <strong>
                ${escapeHtml(
                  address.fullName ||
                  ''
                )}
              </strong>

              <span>
                ${escapeHtml(
                  address.phone ||
                  ''
                )}
              </span>

              <span>
                ${escapeHtml(
                  address.street ||
                  ''
                )}
              </span>

              <span>
                ${escapeHtml(
                  address.city ||
                  ''
                )},
                ${escapeHtml(
                  address.state ||
                  ''
                )}
              </span>

              <span>
                ${escapeHtml(
                  address.zipCode ||
                  ''
                )},
                ${escapeHtml(
                  address.country ||
                  ''
                )}
              </span>

            </div>

          </div>


          <!-- SUMMARY -->

          <div class="admin-detail-section">

            <div class="admin-detail-section-header">

              <h3>
                💰 Order Summary
              </h3>

            </div>


            <div class="summary-row">

              <span>
                Items Total
              </span>

              <span>
                ${formatPrice(
                  order.itemsPrice
                )}
              </span>

            </div>


            ${
              Number(
                order.discountAmount
              ) > 0
                ? `
                  <div class="summary-row discount-row">

                    <span>
                      Discount
                    </span>

                    <span>
                      -${formatPrice(
                        order.discountAmount
                      )}
                    </span>

                  </div>
                `
                : ''
            }


            <div class="summary-row">

              <span>
                Tax
              </span>

              <span>
                ${formatPrice(
                  order.taxPrice
                )}
              </span>

            </div>


            <div class="summary-row">

              <span>
                Shipping
              </span>

              <span>
                ${
                  Number(
                    order.shippingPrice
                  ) === 0
                    ? '<strong class="free-shipping">FREE</strong>'
                    : formatPrice(
                        order.shippingPrice
                      )
                }
              </span>

            </div>


            <div class="summary-row total">

              <span>
                Total
              </span>

              <strong>
                ${formatPrice(
                  order.totalPrice
                )}
              </strong>

            </div>

          </div>


        </div>

      `
    );


    // ==============================
    // CLOSE DETAIL
    // ==============================

    const closeButton =
      document.getElementById(
        'close-order-detail'
      );


    if (closeButton) {

      closeButton.addEventListener(
        'click',
        () => {

          const modal =
            document.getElementById(
              'order-detail-modal'
            );

          if (modal) {
            modal.remove();
          }

        }
      );

    }


    // Scroll to detail

    const detail =
      document.getElementById(
        'order-detail-modal'
      );

    if (detail) {

      detail.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }


  } catch (err) {

    console.error(
      'Order detail error:',
      err
    );


    showToast(
      err.message ||
      'Unable to load order details',
      'error'
    );

  }

}