// ==============================
// cart.js - Premium Shopping Cart
// ==============================

let cartLoading = false;


// ==================================================
// LOAD CART
// ==================================================

async function loadCart() {

  const root =
    document.getElementById('cart-root');

  if (!root) return;

  if (!requireLogin()) return;

  if (cartLoading) return;

  cartLoading = true;


  // Loading UI
  root.innerHTML = `
    <div class="cart-loading">
      <div class="spinner"></div>
      <p>Loading your cart...</p>
    </div>
  `;


  try {

    const data =
      await apiRequest('/cart');

    const cart =
      data.cart || {};

    const totals =
      data.totals || {};

    const items =
      cart.items || [];


    // ==================================================
    // EMPTY CART
    // ==================================================

    if (items.length === 0) {

      root.innerHTML = `

        <div class="empty-state cart-empty-state">

          <div class="cart-empty-icon">
            🛒
          </div>

          <h2>
            Your cart is empty
          </h2>

          <p>
            Looks like you haven't added anything yet.
          </p>

          <a
            href="/products"
            class="btn btn-primary"
          >
            Start Shopping →
          </a>

        </div>

      `;

      return;
    }


    // ==================================================
    // CART LAYOUT
    // ==================================================

    root.innerHTML = `

      <div class="premium-cart-layout">

        <!-- =========================================
             CART ITEMS
        ========================================== -->

        <div class="cart-main">

          <div class="cart-header">

            <div>

              <h2>
                Shopping Cart
              </h2>

              <p>
                ${items.length}
                ${
                  items.length === 1
                    ? 'item'
                    : 'items'
                }
                in your cart
              </p>

            </div>

            <button
              type="button"
              class="cart-clear-top"
              id="clear-cart-top"
            >
              Clear cart
            </button>

          </div>


          <div
            id="cart-items"
            class="premium-cart-items"
          ></div>

        </div>


        <!-- =========================================
             ORDER SUMMARY
        ========================================== -->

        <aside class="cart-summary-card">

          <div class="summary-header">

            <h3>
              Order Summary
            </h3>

          </div>


          <div class="summary-content">

            <div class="summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                ${formatPrice(
                  totals.itemsPrice || 0
                )}
              </strong>

            </div>


            ${
              Number(totals.discount || 0) > 0
                ? `
                  <div
                    class="summary-row discount-row"
                  >

                    <span>
                      Coupon Discount
                      ${
                        cart.couponCode
                          ? `(${escapeHtml(
                              cart.couponCode
                            )})`
                          : ''
                      }
                    </span>

                    <strong>
                      -${formatPrice(
                        totals.discount
                      )}
                    </strong>

                  </div>
                `
                : ''
            }


            <div class="summary-row">

              <span>
                Tax (5%)
              </span>

              <strong>
                ${formatPrice(
                  totals.taxPrice || 0
                )}
              </strong>

            </div>


            <div class="summary-row">

              <span>
                Shipping
              </span>

              <strong
                class="${
                  Number(
                    totals.shippingPrice || 0
                  ) === 0
                    ? 'free-shipping'
                    : ''
                }"
              >

                ${
                  Number(
                    totals.shippingPrice || 0
                  ) === 0
                    ? 'FREE'
                    : formatPrice(
                        totals.shippingPrice
                      )
                }

              </strong>

            </div>


            <div class="summary-divider"></div>


            <div class="summary-row summary-total">

              <span>
                Total
              </span>

              <strong>
                ${formatPrice(
                  totals.totalPrice || 0
                )}
              </strong>

            </div>


            <!-- Coupon -->

            <div class="coupon-section">

              <label
                for="coupon-input"
              >
                Have a coupon?
              </label>

              <div class="coupon-form">

                <input
                  type="text"
                  id="coupon-input"
                  placeholder="Enter coupon code"
                  value="${
                    cart.couponCode
                      ? escapeHtml(
                          cart.couponCode
                        )
                      : ''
                  }"
                  autocomplete="off"
                />


                ${
                  cart.couponCode
                    ? `
                      <button
                        type="button"
                        class="btn btn-outline coupon-button"
                        id="remove-coupon-btn"
                      >
                        Remove
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        class="btn btn-outline coupon-button"
                        id="apply-coupon-btn"
                      >
                        Apply
                      </button>
                    `
                }

              </div>

            </div>


            <!-- Checkout -->

            <button
              type="button"
              class="btn btn-primary btn-block checkout-button"
              id="checkout-btn"
            >

              Proceed to Checkout
              <span>→</span>

            </button>


            <div class="secure-checkout">

              <span>
                🔒
              </span>

              Secure checkout

            </div>


            <div class="cart-benefits">

              <div>
                🚚
                <span>
                  Fast delivery
                </span>
              </div>

              <div>
                ↩️
                <span>
                  Easy returns
                </span>
              </div>

              <div>
                🔒
                <span>
                  Secure payment
                </span>
              </div>

            </div>

          </div>

        </aside>

      </div>

    `;


    // Render items
    renderCartItems(cart);


    // Setup buttons
    setupCartActions(
      cart
    );


  } catch (err) {

    console.error(
      'Cart loading error:',
      err
    );


    root.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h3>
          Unable to load cart
        </h3>

        <p>
          ${escapeHtml(
            err.message ||
              'Something went wrong.'
          )}
        </p>

        <button
          type="button"
          class="btn btn-primary"
          onclick="loadCart()"
        >
          Try Again
        </button>

      </div>

    `;

  } finally {

    cartLoading = false;

  }

}


// ==================================================
// RENDER CART ITEMS
// ==================================================

function renderCartItems(cart) {

  const container =
    document.getElementById(
      'cart-items'
    );

  if (!container) return;


  const items =
    cart.items || [];


  container.innerHTML =
    items
      .map(
        (item) => {

          const product =
            item.product;


          if (!product) {
            return '';
          }


          const image =
            product.images &&
            product.images.length
              ? product.images[0]
              : 'https://placehold.co/160x160?text=No+Image';


          const quantity =
            Number(
              item.quantity
            ) || 1;


          const itemPrice =
            Number(
              item.price
            ) || 0;


          const itemTotal =
            itemPrice *
            quantity;


          const productName =
            escapeHtml(
              product.name ||
                'Product'
            );


          return `

            <article
              class="premium-cart-item"
              data-id="${escapeHtml(
                product._id
              )}"
            >

              <!-- Image -->

              <a
                href="/product-detail?id=${product._id}"
                class="cart-product-image"
              >

                <img
                  src="${escapeHtml(
                    image
                  )}"
                  alt="${productName}"
                  loading="lazy"
                  onerror="
                    this.onerror=null;
                    this.src='https://placehold.co/160x160?text=No+Image';
                  "
                />

              </a>


              <!-- Details -->

              <div class="cart-product-details">

                ${
                  product.category
                    ? `
                      <span class="cart-product-category">
                        ${escapeHtml(
                          product.category.name
                        )}
                      </span>
                    `
                    : ''
                }


                <a
                  href="/product-detail?id=${product._id}"
                  class="cart-product-name"
                >
                  ${productName}
                </a>


                <div class="cart-product-price">

                  ${formatPrice(
                    itemPrice
                  )}

                  <span>
                    each
                  </span>

                </div>


                <!-- Quantity -->

                <div class="cart-item-bottom">

                  <div class="cart-quantity">

                    <button
                      type="button"
                      class="cart-qty-btn qty-minus"
                      data-id="${product._id}"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>


                    <span
                      class="cart-qty-value"
                    >
                      ${quantity}
                    </span>


                    <button
                      type="button"
                      class="cart-qty-btn qty-plus"
                      data-id="${product._id}"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>

                  </div>


                  <button
                    type="button"
                    class="cart-remove-btn remove-item-btn"
                    data-id="${product._id}"
                  >
                    Remove
                  </button>

                </div>

              </div>


              <!-- Total -->

              <div class="cart-item-total">

                <strong>
                  ${formatPrice(
                    itemTotal
                  )}
                </strong>

              </div>

            </article>

          `;

        }
      )
      .join('');
}


// ==================================================
// CART ACTIONS
// ==================================================

function setupCartActions(cart) {

  const checkoutButton =
    document.getElementById(
      'checkout-btn'
    );


  const clearButton =
    document.getElementById(
      'clear-cart-top'
    );


  // ------------------------------------------
  // Checkout
  // ------------------------------------------

  if (checkoutButton) {

    checkoutButton.addEventListener(
      'click',
      () => {

        window.location.href =
          '/checkout';

      }
    );

  }


  // ------------------------------------------
  // Clear cart
  // ------------------------------------------

  if (clearButton) {

    clearButton.addEventListener(
      'click',
      clearCart
    );

  }


  // ------------------------------------------
  // Apply coupon
  // ------------------------------------------

  const applyCouponButton =
    document.getElementById(
      'apply-coupon-btn'
    );


  if (applyCouponButton) {

    applyCouponButton.addEventListener(
      'click',
      applyCoupon
    );

  }


  // ------------------------------------------
  // Remove coupon
  // ------------------------------------------

  const removeCouponButton =
    document.getElementById(
      'remove-coupon-btn'
    );


  if (removeCouponButton) {

    removeCouponButton.addEventListener(
      'click',
      removeCoupon
    );

  }


  // ------------------------------------------
  // Enter key for coupon
  // ------------------------------------------

  const couponInput =
    document.getElementById(
      'coupon-input'
    );


  if (couponInput) {

    couponInput.addEventListener(
      'keydown',
      (event) => {

        if (
          event.key === 'Enter'
        ) {

          event.preventDefault();

          if (
            applyCouponButton
          ) {
            applyCoupon();
          }

        }

      }
    );

  }


  // ------------------------------------------
  // Quantity buttons
  // ------------------------------------------

  document
    .querySelectorAll(
      '.qty-plus'
    )
    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {

            updateQty(
              button.dataset.id,
              1
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      '.qty-minus'
    )
    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {

            updateQty(
              button.dataset.id,
              -1
            );

          }
        );

      }
    );


  // ------------------------------------------
  // Remove items
  // ------------------------------------------

  document
    .querySelectorAll(
      '.remove-item-btn'
    )
    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {

            removeCartItem(
              button.dataset.id
            );

          }
        );

      }
    );

}


// ==================================================
// UPDATE QUANTITY
// ==================================================

async function updateQty(
  productId,
  delta
) {

  const item =
    document.querySelector(
      `.premium-cart-item[data-id="${CSS.escape(
        String(productId)
      )}"]`
    );


  if (!item) return;


  const qtyElement =
    item.querySelector(
      '.cart-qty-value'
    );


  if (!qtyElement) return;


  const currentQty =
    Number(
      qtyElement.textContent
    ) || 1;


  const newQty =
    currentQty + delta;


  if (newQty < 1) {
    return;
  }


  // Loading state
  item.classList.add(
    'updating'
  );


  try {

    await apiRequest(
      `/cart/${productId}`,
      {
        method: 'PUT',

        body: {
          quantity:
            newQty
        }
      }
    );


    await loadCart();

    updateNavBadges();


  } catch (err) {

    showToast(
      err.message ||
        'Unable to update quantity',
      'error'
    );


  } finally {

    item.classList.remove(
      'updating'
    );

  }

}


// ==================================================
// REMOVE CART ITEM
// ==================================================

async function removeCartItem(
  productId
) {

  if (!productId) {
    return;
  }


  try {

    await apiRequest(
      `/cart/${productId}`,
      {
        method: 'DELETE'
      }
    );


    showToast(
      'Item removed from cart',
      'success'
    );


    await loadCart();

    updateNavBadges();


  } catch (err) {

    showToast(
      err.message ||
        'Unable to remove item',
      'error'
    );

  }

}


// ==================================================
// CLEAR CART
// ==================================================

async function clearCart() {

  if (
    !confirmAction(
      'Clear all items from your cart?'
    )
  ) {
    return;
  }


  try {

    await apiRequest(
      '/cart',
      {
        method: 'DELETE'
      }
    );


    showToast(
      'Cart cleared successfully',
      'success'
    );


    await loadCart();

    updateNavBadges();


  } catch (err) {

    showToast(
      err.message ||
        'Unable to clear cart',
      'error'
    );

  }

}


// ==================================================
// APPLY COUPON
// ==================================================

async function applyCoupon() {

  const input =
    document.getElementById(
      'coupon-input'
    );


  if (!input) {
    return;
  }


  const code =
    input.value.trim();


  if (!code) {

    showToast(
      'Please enter a coupon code',
      'error'
    );

    input.focus();

    return;
  }


  const button =
    document.getElementById(
      'apply-coupon-btn'
    );


  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        'Applying...';

    }


    await apiRequest(
      '/cart/coupon',
      {
        method: 'POST',

        body: {
          code
        }
      }
    );


    showToast(
      'Coupon applied successfully 🎉',
      'success'
    );


    await loadCart();


  } catch (err) {

    showToast(
      err.message ||
        'Invalid coupon code',
      'error'
    );


    if (button) {

      button.disabled =
        false;

      button.textContent =
        'Apply';

    }

  }

}


// ==================================================
// REMOVE COUPON
// ==================================================

async function removeCoupon() {

  const button =
    document.getElementById(
      'remove-coupon-btn'
    );


  try {

    if (button) {

      button.disabled =
        true;

      button.textContent =
        'Removing...';

    }


    await apiRequest(
      '/cart/coupon',
      {
        method: 'DELETE'
      }
    );


    showToast(
      'Coupon removed',
      'success'
    );


    await loadCart();


  } catch (err) {

    showToast(
      err.message ||
        'Unable to remove coupon',
      'error'
    );


    if (button) {

      button.disabled =
        false;

      button.textContent =
        'Remove';

    }

  }

}


// ==================================================
// PAGE START
// ==================================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    loadCart();

  }
);