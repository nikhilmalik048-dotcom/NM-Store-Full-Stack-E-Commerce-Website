// ==============================
// checkout.js - NM Store Checkout
// ==============================

let savedAddresses = [];
let cartTotals = null;
let checkoutLoading = false;


// ==================================================
// LOAD CHECKOUT
// ==================================================

async function loadCheckout() {

  const root = document.getElementById('checkout-root');

  if (!root) return;

  if (!requireLogin()) return;

  if (checkoutLoading) return;

  checkoutLoading = true;

  root.innerHTML = `
    <div class="checkout-loading">
      <div class="spinner"></div>
      <p>Preparing your checkout...</p>
    </div>
  `;

  try {

    const [cartData, userData] = await Promise.all([
      apiRequest('/cart'),
      apiRequest('/auth/me')
    ]);

    const cart = cartData.cart || {};
    const items = cart.items || [];

    cartTotals = cartData.totals || {};
    savedAddresses = userData.user?.addresses || [];


    // ==================================================
    // EMPTY CART
    // ==================================================

    if (items.length === 0) {

      root.innerHTML = `
        <div class="empty-state checkout-empty">

          <div class="cart-empty-icon">
            🛒
          </div>

          <h2>Your cart is empty</h2>

          <p>
            Add some products before checking out.
          </p>

          <a
            href="/products"
            class="btn btn-primary"
          >
            Browse Products →
          </a>

        </div>
      `;

      return;
    }


    // ==================================================
    // CHECKOUT PAGE
    // ==================================================

    root.innerHTML = `

      <div class="premium-checkout-layout">

        <!-- ==========================================
             LEFT SIDE
        =========================================== -->

        <div class="checkout-main">

          <!-- CHECKOUT PROGRESS -->

          <div class="checkout-progress">

            <div class="checkout-step active">
              <span>1</span>

              <div>
                <strong>Delivery</strong>
                <small>Shipping address</small>
              </div>
            </div>

            <div class="checkout-progress-line"></div>

            <div class="checkout-step active">
              <span>2</span>

              <div>
                <strong>Payment</strong>
                <small>Payment method</small>
              </div>
            </div>

            <div class="checkout-progress-line"></div>

            <div class="checkout-step">
              <span>3</span>

              <div>
                <strong>Confirmation</strong>
                <small>Place order</small>
              </div>
            </div>

          </div>


          <!-- ==========================================
               SHIPPING ADDRESS
          =========================================== -->

          <section class="checkout-card">

            <div class="checkout-card-header">

              <div class="checkout-card-title">

                <span class="checkout-section-number">
                  01
                </span>

                <div>
                  <h2>Shipping Address</h2>

                  <p>
                    Where should we deliver your order?
                  </p>
                </div>

              </div>

            </div>


            <div id="saved-addresses"></div>


            <button
              type="button"
              class="btn btn-outline add-address-btn"
              id="new-address-toggle"
            >
              <span>+</span>
              Add New Address
            </button>


            <!-- NEW ADDRESS FORM -->

            <form
              id="address-form"
              class="checkout-address-form"
              style="display: none;"
            >

              <div class="new-address-title">
                Add a new address
              </div>


              <div class="checkout-form-grid">

                <div class="form-group">

                  <label for="addr-name">
                    Full Name
                  </label>

                  <input
                    type="text"
                    id="addr-name"
                    placeholder="Enter full name"
                    autocomplete="name"
                    required
                  />

                </div>


                <div class="form-group">

                  <label for="addr-phone">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    id="addr-phone"
                    placeholder="Enter phone number"
                    autocomplete="tel"
                    inputmode="numeric"
                    maxlength="10"
                    required
                  />

                </div>

              </div>


              <div class="form-group">

                <label for="addr-street">
                  Street Address
                </label>

                <input
                  type="text"
                  id="addr-street"
                  placeholder="House number, street, area"
                  autocomplete="street-address"
                  required
                />

              </div>


              <div class="checkout-form-grid">

                <div class="form-group">

                  <label for="addr-city">
                    City
                  </label>

                  <input
                    type="text"
                    id="addr-city"
                    placeholder="City"
                    autocomplete="address-level2"
                    required
                  />

                </div>


                <div class="form-group">

                  <label for="addr-state">
                    State
                  </label>

                  <input
                    type="text"
                    id="addr-state"
                    placeholder="State"
                    autocomplete="address-level1"
                    required
                  />

                </div>

              </div>


              <div class="checkout-form-grid">

                <div class="form-group">

                  <label for="addr-zip">
                    PIN / ZIP Code
                  </label>

                  <input
                    type="text"
                    id="addr-zip"
                    placeholder="PIN code"
                    autocomplete="postal-code"
                    inputmode="numeric"
                    maxlength="6"
                    required
                  />

                </div>


                <div class="form-group">

                  <label for="addr-country">
                    Country
                  </label>

                  <input
                    type="text"
                    id="addr-country"
                    value="India"
                    autocomplete="country-name"
                    required
                  />

                </div>

              </div>


              <div class="address-form-actions">

                <button
                  type="submit"
                  class="btn btn-primary"
                  id="save-address-btn"
                >
                  Save Address
                </button>

                <button
                  type="button"
                  class="btn btn-outline"
                  id="cancel-address-btn"
                >
                  Cancel
                </button>

              </div>

            </form>

          </section>


          <!-- ==========================================
               PAYMENT
          =========================================== -->

          <section class="checkout-card">

            <div class="checkout-card-header">

              <div class="checkout-card-title">

                <span class="checkout-section-number">
                  02
                </span>

                <div>

                  <h2>Payment Method</h2>

                  <p>
                    Choose how you'd like to pay.
                  </p>

                </div>

              </div>

            </div>


            <div class="payment-options">

              <!-- COD -->

              <label class="payment-option selected">

                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked
                />

                <div class="payment-icon">
                  💵
                </div>

                <div class="payment-details">

                  <strong>
                    Cash on Delivery
                  </strong>

                  <span>
                    Pay when your order arrives
                  </span>

                </div>

                <span class="payment-check">
                  ✓
                </span>

              </label>


              <!-- ONLINE PAYMENT -->

              <div class="payment-coming-soon">

                <span>🔒</span>

                <div>

                  <strong>
                    Online Payment
                  </strong>

                  <small>
                    Card, UPI & other online methods
                    coming soon
                  </small>

                </div>

                <span>
                  Coming soon
                </span>

              </div>

            </div>


            <div class="payment-security">

              <span>🔐</span>

              <div>

                <strong>
                  Secure checkout
                </strong>

                <p>
                  Your order information is securely
                  processed.
                </p>

              </div>

            </div>

          </section>

        </div>


        <!-- ==========================================
             RIGHT SIDE
        =========================================== -->

        <aside class="checkout-summary-card">

          <div class="checkout-summary-header">

            <h2>Order Summary</h2>

            <span>
              ${items.length}
              ${items.length === 1 ? 'item' : 'items'}
            </span>

          </div>


          <!-- PRODUCTS -->

          <div class="checkout-products">

            ${items.map(item => {

              if (!item.product) return '';

              const product = item.product;

              const image =
                product.images &&
                product.images.length
                  ? product.images[0]
                  : 'https://placehold.co/80x80?text=No+Image';

              const quantity =
                Number(item.quantity) || 1;

              const price =
                Number(item.price) || 0;

              const total =
                price * quantity;

              return `

                <div class="checkout-product">

                  <div class="checkout-product-image">

                    <img
                      src="${escapeHtml(image)}"
                      alt="${escapeHtml(
                        product.name || 'Product'
                      )}"
                      loading="lazy"
                      onerror="
                        this.onerror=null;
                        this.src='https://placehold.co/80x80?text=No+Image';
                      "
                    />

                    <span>
                      ${quantity}
                    </span>

                  </div>


                  <div class="checkout-product-info">

                    <strong>
                      ${escapeHtml(
                        product.name || 'Product'
                      )}
                    </strong>

                    <small>
                      ${formatPrice(price)} each
                    </small>

                  </div>


                  <strong class="checkout-product-total">
                    ${formatPrice(total)}
                  </strong>

                </div>

              `;

            }).join('')}

          </div>


          <div class="checkout-summary-divider"></div>


          <!-- PRICE DETAILS -->

          <div class="checkout-price-details">

            <div class="summary-row">

              <span>Subtotal</span>

              <strong>
                ${formatPrice(
                  cartTotals.itemsPrice || 0
                )}
              </strong>

            </div>


            ${
              Number(cartTotals.discount || 0) > 0
                ? `
                  <div class="summary-row discount-row">

                    <span>
                      Discount
                    </span>

                    <strong>
                      -${formatPrice(
                        cartTotals.discount
                      )}
                    </strong>

                  </div>
                `
                : ''
            }


            <div class="summary-row">

              <span>Tax</span>

              <strong>
                ${formatPrice(
                  cartTotals.taxPrice || 0
                )}
              </strong>

            </div>


            <div class="summary-row">

              <span>Shipping</span>

              <strong
                class="${
                  Number(
                    cartTotals.shippingPrice || 0
                  ) === 0
                    ? 'free-shipping'
                    : ''
                }"
              >

                ${
                  Number(
                    cartTotals.shippingPrice || 0
                  ) === 0
                    ? 'FREE'
                    : formatPrice(
                        cartTotals.shippingPrice
                      )
                }

              </strong>

            </div>

          </div>


          <div class="checkout-summary-divider"></div>


          <!-- TOTAL -->

          <div class="checkout-total-row">

            <span>Total</span>

            <strong>
              ${formatPrice(
                cartTotals.totalPrice || 0
              )}
            </strong>

          </div>


          <!-- PLACE ORDER -->

          <button
            type="button"
            class="btn btn-primary btn-block place-order-button"
            id="place-order-btn"
          >

            <span>
              Place Order
            </span>

            <span>
              →
            </span>

          </button>


          <p class="checkout-terms">
            By placing your order, you agree to
            our terms and conditions.
          </p>


          <!-- TRUST -->

          <div class="checkout-trust">

            <div>
              🔒
              <span>Secure</span>
            </div>

            <div>
              🚚
              <span>Fast Delivery</span>
            </div>

            <div>
              ↩️
              <span>Easy Returns</span>
            </div>

          </div>

        </aside>

      </div>

    `;


    renderAddresses();

    setupCheckoutEvents();


  } catch (err) {

    console.error(
      'Checkout loading error:',
      err
    );

    root.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h3>
          Unable to load checkout
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
          onclick="loadCheckout()"
        >
          Try Again
        </button>

      </div>

    `;

  } finally {

    checkoutLoading = false;

  }

}


// ==================================================
// RENDER SAVED ADDRESSES
// ==================================================

function renderAddresses() {

  const container =
    document.getElementById(
      'saved-addresses'
    );

  if (!container) return;


  if (!savedAddresses.length) {

    container.innerHTML = `

      <div class="no-addresses">

        <span>📍</span>

        <div>

          <strong>
            No saved addresses
          </strong>

          <p>
            Add a delivery address to continue.
          </p>

        </div>

      </div>

    `;

    return;

  }


  container.innerHTML =
    savedAddresses.map((address, index) => {

      const id =
        String(address._id || '');

      return `

        <label
          class="saved-address ${
            index === 0 ? 'selected' : ''
          }"
        >

          <input
            type="radio"
            name="selected-address"
            value="${escapeHtml(id)}"
            ${index === 0 ? 'checked' : ''}
          />


          <div class="address-radio">
            <span></span>
          </div>


          <div class="address-content">

            <div class="address-top">

              <strong>
                ${escapeHtml(
                  address.fullName || ''
                )}
              </strong>

              ${
                index === 0
                  ? `
                    <span class="default-address">
                      Default
                    </span>
                  `
                  : ''
              }

            </div>


            <p class="address-phone">

              📞
              ${escapeHtml(
                address.phone || ''
              )}

            </p>


            <p class="address-text">

              ${escapeHtml(
                address.street || ''
              )},

              ${escapeHtml(
                address.city || ''
              )},

              ${escapeHtml(
                address.state || ''
              )}

              -

              ${escapeHtml(
                address.zipCode || ''
              )},

              ${escapeHtml(
                address.country || ''
              )}

            </p>

          </div>

        </label>

      `;

    }).join('');


  // Address selection

  container
    .querySelectorAll(
      'input[name="selected-address"]'
    )
    .forEach(radio => {

      radio.addEventListener(
        'change',
        () => {

          container
            .querySelectorAll(
              '.saved-address'
            )
            .forEach(card => {

              card.classList.remove(
                'selected'
              );

            });


          const card =
            radio.closest(
              '.saved-address'
            );

          if (card) {
            card.classList.add(
              'selected'
            );
          }

        }
      );

    });

}


// ==================================================
// SETUP CHECKOUT EVENTS
// ==================================================

function setupCheckoutEvents() {

  const newAddressButton =
    document.getElementById(
      'new-address-toggle'
    );

  const addressForm =
    document.getElementById(
      'address-form'
    );


  // ------------------------------------------
  // NEW ADDRESS
  // ------------------------------------------

  if (
    newAddressButton &&
    addressForm
  ) {

    newAddressButton.addEventListener(
      'click',
      () => {

        const isHidden =
          addressForm.style.display ===
          'none';


        if (isHidden) {

          addressForm.style.display =
            'block';

          newAddressButton.innerHTML =
            '<span>−</span> Close Address Form';


          document
            .getElementById('addr-name')
            ?.focus();

        } else {

          addressForm.style.display =
            'none';

          newAddressButton.innerHTML =
            '<span>+</span> Add New Address';

        }

      }
    );

  }


  // ------------------------------------------
  // CANCEL ADDRESS
  // ------------------------------------------

  const cancelButton =
    document.getElementById(
      'cancel-address-btn'
    );


  if (cancelButton) {

    cancelButton.addEventListener(
      'click',
      () => {

        closeAddressForm();

      }
    );

  }


  // ------------------------------------------
  // SAVE ADDRESS
  // ------------------------------------------

  if (addressForm) {

    addressForm.addEventListener(
      'submit',
      saveAddress
    );

  }


  // ------------------------------------------
  // PLACE ORDER
  // ------------------------------------------

  const placeOrderButton =
    document.getElementById(
      'place-order-btn'
    );


  if (placeOrderButton) {

    placeOrderButton.addEventListener(
      'click',
      placeOrder
    );

  }


  // ------------------------------------------
  // PAYMENT SELECTION
  // ------------------------------------------

  document
    .querySelectorAll(
      'input[name="payment"]'
    )
    .forEach(radio => {

      radio.addEventListener(
        'change',
        () => {

          document
            .querySelectorAll(
              '.payment-option'
            )
            .forEach(option => {

              option.classList.remove(
                'selected'
              );

            });


          radio
            .closest('.payment-option')
            ?.classList.add(
              'selected'
            );

        }
      );

    });

}


// ==================================================
// CLOSE ADDRESS FORM
// ==================================================

function closeAddressForm() {

  const addressForm =
    document.getElementById(
      'address-form'
    );

  const newAddressButton =
    document.getElementById(
      'new-address-toggle'
    );


  if (addressForm) {

    addressForm.reset();

    const country =
      document.getElementById(
        'addr-country'
      );

    if (country) {
      country.value = 'India';
    }

    addressForm.style.display =
      'none';

  }


  if (newAddressButton) {

    newAddressButton.innerHTML =
      '<span>+</span> Add New Address';

  }

}


// ==================================================
// SAVE NEW ADDRESS
// ==================================================

async function saveAddress(event) {

  event.preventDefault();


  const saveButton =
    document.getElementById(
      'save-address-btn'
    );


  const address = {

    fullName:
      document.getElementById(
        'addr-name'
      )?.value.trim() || '',

    phone:
      document.getElementById(
        'addr-phone'
      )?.value.trim() || '',

    street:
      document.getElementById(
        'addr-street'
      )?.value.trim() || '',

    city:
      document.getElementById(
        'addr-city'
      )?.value.trim() || '',

    state:
      document.getElementById(
        'addr-state'
      )?.value.trim() || '',

    zipCode:
      document.getElementById(
        'addr-zip'
      )?.value.trim() || '',

    country:
      document.getElementById(
        'addr-country'
      )?.value.trim() || ''

  };


  // ------------------------------------------
  // BASIC VALIDATION
  // ------------------------------------------

  if (
    !address.fullName ||
    !address.phone ||
    !address.street ||
    !address.city ||
    !address.state ||
    !address.zipCode ||
    !address.country
  ) {

    showToast(
      'Please fill in all address fields',
      'error'
    );

    return;

  }


  // Phone validation

  if (!/^[0-9]{10}$/.test(address.phone)) {

    showToast(
      'Please enter a valid 10-digit phone number',
      'error'
    );

    return;

  }


  // PIN validation

  if (!/^[0-9]{6}$/.test(address.zipCode)) {

    showToast(
      'Please enter a valid 6-digit PIN code',
      'error'
    );

    return;

  }


  try {

    if (saveButton) {

      saveButton.disabled = true;

      saveButton.textContent =
        'Saving...';

    }


    const data =
      await apiRequest(
        '/users/addresses',
        {
          method: 'POST',
          body: address
        }
      );


    savedAddresses =
      data.addresses || [];


    showToast(
      'Address saved successfully',
      'success'
    );


    // Re-render addresses

    renderAddresses();


    // Close form

    closeAddressForm();


  } catch (err) {

    console.error(
      'Save address error:',
      err
    );

    showToast(
      err.message ||
      'Unable to save address',
      'error'
    );

  } finally {

    if (saveButton) {

      saveButton.disabled = false;

      saveButton.textContent =
        'Save Address';

    }

  }

}


// ==================================================
// PLACE ORDER
// ==================================================

async function placeOrder() {

  const selected =
    document.querySelector(
      'input[name="selected-address"]:checked'
    );


  if (!selected) {

    showToast(
      'Please select or add a shipping address',
      'error'
    );

    return;

  }


  const address =
    savedAddresses.find(
      item =>
        String(item._id) ===
        String(selected.value)
    );


  if (!address) {

    showToast(
      'Selected address could not be found',
      'error'
    );

    return;

  }


  const payment =
    document.querySelector(
      'input[name="payment"]:checked'
    );


  if (!payment) {

    showToast(
      'Please select a payment method',
      'error'
    );

    return;

  }


  const paymentMethod =
    payment.value;


  const button =
    document.getElementById(
      'place-order-btn'
    );


  if (!button) return;


  if (button.disabled) return;


  button.disabled = true;


  button.innerHTML = `
    <span>
      Placing order...
    </span>

    <span>
      ⏳
    </span>
  `;


  try {

    const shippingAddress = {

      fullName:
        address.fullName,

      phone:
        address.phone,

      street:
        address.street,

      city:
        address.city,

      state:
        address.state,

      zipCode:
        address.zipCode,

      country:
        address.country

    };


    const data =
      await apiRequest(
        '/orders',
        {
          method: 'POST',

          body: {

            shippingAddress,

            billingAddress:
              shippingAddress,

            paymentMethod

          }

        }
      );


    showToast(
      'Order placed successfully! 🎉',
      'success'
    );


    if (
      typeof updateNavBadges ===
      'function'
    ) {

      updateNavBadges();

    }


    if (
      data &&
      data.order &&
      data.order._id
    ) {

      setTimeout(() => {

        window.location.href =
          `/order-success.html?orderId=${encodeURIComponent(
            data.order._id
          )}`;

      }, 800);

    } else {

      // Fallback if order ID is not returned

      setTimeout(() => {

        window.location.href =
          '/orders.html';

      }, 1000);

    }


  } catch (err) {

    console.error(
      'Place order error:',
      err
    );


    showToast(
      err.message ||
      'Unable to place order',
      'error'
    );


    button.disabled = false;


    button.innerHTML = `
      <span>
        Place Order
      </span>

      <span>
        →
      </span>
    `;

  }

}


// ==================================================
// START
// ==================================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    loadCheckout();

  }
);