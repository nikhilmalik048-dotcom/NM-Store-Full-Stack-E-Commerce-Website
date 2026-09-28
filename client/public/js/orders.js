// ==============================
// orders.js - My Orders
// List + Detail + Cancel + Invoice
// ==============================

async function loadOrders() {
  const root = document.getElementById('orders-root');

  if (!requireLogin()) return;

  root.innerHTML = `
    <div class="orders-loading">
      <div class="spinner"></div>
      <p>Loading your orders...</p>
    </div>
  `;

  try {
    const { orders } = await apiRequest('/orders/my-orders');

    if (!orders || orders.length === 0) {
      root.innerHTML = `
        <div class="empty-state orders-empty">

          <div class="empty-icon">
            📦
          </div>

          <h3>No orders yet</h3>

          <p>
            You haven't placed any orders yet.
            Start shopping and your orders will appear here.
          </p>

          <a
            href="/products"
            class="btn btn-primary mt-2"
          >
            Start Shopping →
          </a>

        </div>
      `;

      return;
    }

    root.innerHTML = `
      <div class="orders-count">
        <strong>${orders.length}</strong>
        ${orders.length === 1 ? 'order' : 'orders'} found
      </div>

      <div class="orders-list">

        ${orders.map((order) => {

          const statusClass =
            String(order.status || '')
              .toLowerCase()
              .replace(/\s+/g, '-');

          const canCancel =
            ['Pending', 'Packed'].includes(order.status);

          const itemCount =
            order.items?.reduce(
              (total, item) => total + Number(item.quantity || 0),
              0
            ) || 0;

          return `
            <article class="order-card">

              <!-- Order Header -->

              <div class="order-card-header">

                <div class="order-info">

                  <span class="order-label">
                    ORDER
                  </span>

                  <strong class="order-number">
                    ${escapeHtml(order.orderNumber || 'N/A')}
                  </strong>

                  <span class="order-date">
                    Placed on
                    ${new Date(order.createdAt).toLocaleDateString(
                      undefined,
                      {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }
                    )}
                  </span>

                </div>

                <span
                  class="status-badge status-${statusClass}"
                >
                  ${escapeHtml(order.status || 'Unknown')}
                </span>

              </div>


              <!-- Order Body -->

              <div class="order-card-body">

                <div class="order-stat">

                  <span class="order-stat-icon">
                    📦
                  </span>

                  <div>
                    <small>Items</small>
                    <strong>
                      ${itemCount}
                    </strong>
                  </div>

                </div>


                <div class="order-stat">

                  <span class="order-stat-icon">
                    💰
                  </span>

                  <div>
                    <small>Total</small>
                    <strong>
                      ${formatPrice(order.totalPrice)}
                    </strong>
                  </div>

                </div>


                <div class="order-stat">

                  <span class="order-stat-icon">
                    💳
                  </span>

                  <div>
                    <small>Payment</small>
                    <strong>
                      ${escapeHtml(order.paymentMethod || 'N/A')}
                    </strong>
                  </div>

                </div>

              </div>


              <!-- Order Actions -->

              <div class="order-card-footer">

                <button
                  class="btn btn-sm btn-primary view-order-btn"
                  data-id="${order._id}"
                  type="button"
                >
                  View Details →
                </button>

                ${
                  canCancel
                    ? `
                      <button
                        class="btn btn-sm btn-danger cancel-order-btn"
                        data-id="${order._id}"
                        type="button"
                      >
                        Cancel Order
                      </button>
                    `
                    : ''
                }

              </div>

            </article>
          `;
        }).join('')}

      </div>
    `;


    // ==============================
    // VIEW ORDER BUTTONS
    // ==============================

    root
      .querySelectorAll('.view-order-btn')
      .forEach((btn) => {

        btn.addEventListener('click', () => {
          viewOrderDetail(btn.dataset.id);
        });

      });


    // ==============================
    // CANCEL ORDER BUTTONS
    // ==============================

    root
      .querySelectorAll('.cancel-order-btn')
      .forEach((btn) => {

        btn.addEventListener('click', async () => {

          if (
            !confirmAction(
              'Are you sure you want to cancel this order?'
            )
          ) {
            return;
          }

          const originalText = btn.textContent;

          btn.disabled = true;
          btn.textContent = 'Cancelling...';

          try {

            await apiRequest(
              `/orders/${btn.dataset.id}/cancel`,
              {
                method: 'PUT',
                body: {
                  reason: 'Cancelled by customer'
                }
              }
            );

            showToast(
              'Order cancelled successfully',
              'success'
            );

            await loadOrders();

          } catch (err) {

            showToast(
              err.message || 'Unable to cancel order',
              'error'
            );

            btn.disabled = false;
            btn.textContent = originalText;
          }

        });

      });

  } catch (err) {

    root.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h3>Unable to load orders</h3>

        <p>
          ${escapeHtml(
            err.message || 'Something went wrong.'
          )}
        </p>

        <button
          class="btn btn-primary mt-2"
          onclick="loadOrders()"
        >
          Try Again
        </button>

      </div>
    `;

  }
}


// ==============================
// VIEW ORDER DETAIL
// ==============================

async function viewOrderDetail(orderId) {

  const ordersRoot =
    document.getElementById('orders-root');

  const section =
    document.getElementById('order-detail-section');

  const root =
    document.getElementById('order-detail-root');


  ordersRoot.parentElement.style.display = 'none';

  section.style.display = 'block';

  root.innerHTML = `
    <div class="orders-loading">
      <div class="spinner"></div>
      <p>Loading order details...</p>
    </div>
  `;


  try {

    const { order } =
      await apiRequest(`/orders/${orderId}`);


    const statusClass =
      String(order.status || '')
        .toLowerCase()
        .replace(/\s+/g, '-');


    // ==============================
    // ITEMS HTML
    // ==============================

    const itemsHTML =
      order.items.map((item) => {

        const image =
          item.image ||
          'https://placehold.co/100x100?text=No+Image';

        const quantity =
          Number(item.quantity || 0);

        const itemTotal =
          Number(item.price || 0) * quantity;


        return `
          <div class="order-detail-item">

            <div class="order-detail-image">

              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(item.name || 'Product')}"
                loading="lazy"
              />

            </div>


            <div class="order-detail-item-info">

              <h4>
                ${escapeHtml(item.name || 'Product')}
              </h4>

              <p>
                Quantity:
                <strong>${quantity}</strong>
              </p>

              <p>
                Price:
                <strong>
                  ${formatPrice(item.price)}
                </strong>
              </p>

            </div>


            <div class="order-detail-item-total">

              <strong>
                ${formatPrice(itemTotal)}
              </strong>

            </div>

          </div>
        `;

      }).join('');


    // ==============================
    // TIMELINE
    // ==============================

    const timelineHTML =
      (order.statusHistory || [])
        .map((history, index) => {

          const historyStatus =
            String(history.status || '')
              .toLowerCase()
              .replace(/\s+/g, '-');

          return `
            <div class="order-timeline-item">

              <div class="timeline-dot ${historyStatus}">
                ${index === 0 ? '✓' : ''}
              </div>

              <div class="timeline-content">

                <strong>
                  ${escapeHtml(history.status || '')}
                </strong>

                <span>
                  ${new Date(
                    history.changedAt
                  ).toLocaleString()}
                </span>

              </div>

            </div>
          `;

        }).join('');


    // ==============================
    // SHIPPING ADDRESS
    // ==============================

    const address =
      order.shippingAddress || {};


    // ==============================
    // DETAIL PAGE
    // ==============================

    root.innerHTML = `

      <div class="order-detail-page">


        <!-- Header -->

        <div class="order-detail-top">

          <div>

            <span class="section-badge">
              📦 ORDER DETAILS
            </span>

            <h2>
              ${escapeHtml(order.orderNumber || 'Order')}
            </h2>

            <p>
              Placed on
              ${new Date(
                order.createdAt
              ).toLocaleString()}
            </p>

          </div>


          <span
            class="status-badge status-${statusClass}"
          >
            ${escapeHtml(order.status || 'Unknown')}
          </span>

        </div>


        <!-- Status Timeline -->

        <div class="order-detail-card">

          <div class="order-detail-card-title">
            <h3>
              Order Status
            </h3>
          </div>

          <div class="order-timeline">

            ${timelineHTML || `
              <p class="text-muted">
                No status history available.
              </p>
            `}

          </div>

        </div>


        <!-- Items -->

        <div class="order-detail-card">

          <div class="order-detail-card-title">

            <h3>
              Order Items
            </h3>

            <span>
              ${order.items.length}
              ${order.items.length === 1 ? 'item' : 'items'}
            </span>

          </div>


          <div class="order-detail-items">

            ${itemsHTML}

          </div>

        </div>


        <!-- Address + Payment -->

        <div class="order-detail-columns">


          <!-- Shipping -->

          <div class="order-detail-card">

            <div class="order-detail-card-title">

              <h3>
                🚚 Shipping Address
              </h3>

            </div>

            <div class="shipping-address">

              <strong>
                ${escapeHtml(address.fullName || '')}
              </strong>

              <span>
                ${escapeHtml(address.phone || '')}
              </span>

              <span>
                ${escapeHtml(address.street || '')}
              </span>

              <span>
                ${escapeHtml(address.city || '')},
                ${escapeHtml(address.state || '')}
              </span>

              <span>
                ${escapeHtml(address.zipCode || '')},
                ${escapeHtml(address.country || '')}
              </span>

            </div>

          </div>


          <!-- Payment -->

          <div class="order-detail-card">

            <div class="order-detail-card-title">

              <h3>
                💳 Payment
              </h3>

            </div>

            <div class="payment-details">

              <div>
                <span>Method</span>
                <strong>
                  ${escapeHtml(
                    order.paymentMethod || 'N/A'
                  )}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  ${escapeHtml(
                    order.paymentStatus || 'N/A'
                  )}
                </strong>
              </div>

            </div>

          </div>


        </div>


        <!-- Order Summary -->

        <div class="order-detail-card order-summary-card">

          <div class="order-detail-card-title">

            <h3>
              Order Summary
            </h3>

          </div>


          <div class="summary-row">
            <span>Items Total</span>
            <span>
              ${formatPrice(order.itemsPrice)}
            </span>
          </div>


          ${
            order.discountAmount > 0
              ? `
                <div class="summary-row discount-row">
                  <span>Discount</span>
                  <span>
                    -${formatPrice(order.discountAmount)}
                  </span>
                </div>
              `
              : ''
          }


          <div class="summary-row">
            <span>Tax</span>
            <span>
              ${formatPrice(order.taxPrice)}
            </span>
          </div>


          <div class="summary-row">

            <span>
              Shipping
            </span>

            <span>
              ${
                order.shippingPrice === 0
                  ? '<strong class="free-shipping">FREE</strong>'
                  : formatPrice(order.shippingPrice)
              }
            </span>

          </div>


          <div class="summary-row total">

            <span>
              Total
            </span>

            <strong>
              ${formatPrice(order.totalPrice)}
            </strong>

          </div>


          <button
            class="btn btn-outline mt-3"
            id="print-invoice-btn"
            type="button"
          >
            🖨️ Print Invoice
          </button>

        </div>


      </div>
    `;


    // ==============================
    // PRINT INVOICE
    // ==============================

    const printButton =
      document.getElementById('print-invoice-btn');

    if (printButton) {

      printButton.addEventListener(
        'click',
        () => window.print()
      );

    }

  } catch (err) {

    root.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h3>
          Unable to load order
        </h3>

        <p>
          ${escapeHtml(
            err.message || 'Something went wrong.'
          )}
        </p>

        <button
          class="btn btn-primary mt-2"
          onclick="loadOrders()"
        >
          Back to Orders
        </button>

      </div>
    `;

  }
}


// ==============================
// BACK TO ORDERS
// ==============================

const backButton =
  document.getElementById('back-to-orders');

if (backButton) {

  backButton.addEventListener(
    'click',
    () => {

      document
        .getElementById('order-detail-section')
        .style.display = 'none';

      document
        .getElementById('orders-root')
        .parentElement
        .style.display = 'block';

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

    }
  );

}


// ==============================
// INITIALIZE
// ==============================

document.addEventListener(
  'DOMContentLoaded',
  loadOrders
);