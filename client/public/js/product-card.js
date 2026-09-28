// ==============================
// product-card.js
// Premium Shared Product Card Renderer
// Used by home.js and products.js
// ==============================

function productCardHTML(product) {
  const price = Number(product.price) || 0;
  const discountPrice = Number(product.discountPrice) || 0;

  const hasDiscount =
    discountPrice > 0 && discountPrice < price;

  const finalPrice = hasDiscount ? discountPrice : price;

  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const image =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://placehold.co/500x500?text=NM+Store';

  const stock = Number(product.stock) || 0;

  const stockClass =
    stock === 0
      ? 'low'
      : stock <= 5
        ? 'low'
        : 'ok';

  const stockText =
    stock === 0
      ? 'Out of stock'
      : stock <= 5
        ? `Only ${stock} left`
        : 'In stock';

  const productId = escapeHtml(product._id || '');
  const productName = escapeHtml(product.name || 'Product');

  const categoryName = product.category
    ? escapeHtml(product.category.name || '')
    : '';

  const categorySlug =
    product.category && product.category.slug
      ? product.category.slug
      : '';

  return `
    <article
      class="product-card premium-product-card"
      data-id="${productId}"
    >

      <!-- =========================
           TOP AREA
      ========================== -->
      <div class="product-card-top">

        ${
          hasDiscount
            ? `
              <span class="product-offer-badge">
                -${discountPercent}%
              </span>
            `
            : `
              <span class="product-offer-badge product-offer-badge-hidden">
                Deal
              </span>
            `
        }

        <button
          type="button"
          class="wishlist-btn"
          data-action="wishlist"
          data-id="${productId}"
          title="Add to wishlist"
          aria-label="Add ${productName} to wishlist"
        >
          <span class="wishlist-icon">♡</span>
        </button>

      </div>


      <!-- =========================
           PRODUCT IMAGE
      ========================== -->
      <a
        class="product-image-link"
        href="/product-detail?id=${productId}"
        aria-label="View ${productName}"
      >

        <div class="img-wrap product-image-wrap">

          <img
            src="${escapeHtml(image)}"
            alt="${productName}"
            loading="lazy"
            decoding="async"
            onerror="
              this.onerror=null;
              this.src='https://placehold.co/500x500?text=No+Image';
            "
          />

          <span class="quick-view-label">
            View product →
          </span>

        </div>

      </a>


      <!-- =========================
           PRODUCT INFORMATION
      ========================== -->
      <div class="info product-card-info">

        ${
          categoryName
            ? `
              <a
                class="cat product-category"
                href="/products?category=${encodeURIComponent(
                  categorySlug
                )}"
              >
                ${categoryName}
              </a>
            `
            : ''
        }


        <!-- Product Name -->
        <a
          class="product-title-link"
          href="/product-detail?id=${productId}"
        >
          <h3 class="product-title">
            ${productName}
          </h3>
        </a>


        <!-- Rating -->
        <div
          class="rating product-rating"
          aria-label="Rating ${Number(
            product.ratingsAverage || 0
          ).toFixed(1)} out of 5"
        >

          <span class="stars">
            ${renderStars(product.ratingsAverage || 0)}
          </span>

          <span class="rating-count">
            (${Number(product.ratingsCount) || 0})
          </span>

        </div>


        <!-- Price -->
        <div class="price-row product-price-row">

          <span class="price product-current-price">
            ${formatPrice(finalPrice)}
          </span>

          ${
            hasDiscount
              ? `
                <span class="price-strike product-old-price">
                  ${formatPrice(price)}
                </span>

                <span class="discount-tag product-discount-tag">
                  ${discountPercent}% off
                </span>
              `
              : ''
          }

        </div>


        <!-- Stock -->
        <div class="stock-row">

          <span class="stock-badge ${stockClass}">

            <span class="stock-dot"></span>

            ${stockText}

          </span>

        </div>


        <!-- Add To Cart -->
        <button
          type="button"
          class="btn btn-primary btn-block btn-sm add-cart-btn"
          data-action="add-to-cart"
          data-id="${productId}"
          ${stock === 0 ? 'disabled' : ''}
        >

          <span class="cart-btn-icon">
            🛒
          </span>

          <span>
            ${stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </span>

        </button>

      </div>

    </article>
  `;
}


// ==================================================
// HTML ESCAPE
// ==================================================

function escapeHtml(str) {
  if (str === null || str === undefined) {
    return '';
  }

  const div = document.createElement('div');

  div.textContent = String(str);

  return div.innerHTML;
}


// ==================================================
// PRODUCT CARD EVENTS
// ==================================================

function attachProductCardEvents(container) {

  if (!container) {
    return;
  }


  /*
   * Prevent duplicate event listeners.
   *
   * This is important because products.js
   * uses infinite scrolling.
   */
  if (
    container.dataset.productEventsAttached === 'true'
  ) {
    return;
  }

  container.dataset.productEventsAttached = 'true';


  container.addEventListener('click', async (e) => {

    const cartBtn =
      e.target.closest(
        '[data-action="add-to-cart"]'
      );

    const wishBtn =
      e.target.closest(
        '[data-action="wishlist"]'
      );


    if (!cartBtn && !wishBtn) {
      return;
    }


    e.preventDefault();
    e.stopPropagation();


    // ==================================================
    // ADD TO CART
    // ==================================================

    if (cartBtn) {

      if (!requireLogin()) {
        return;
      }


      const productId =
        cartBtn.dataset.id;


      if (!productId) {
        return;
      }


      if (cartBtn.disabled) {
        return;
      }


      const originalHTML =
        cartBtn.innerHTML;


      try {

        // Loading state
        cartBtn.disabled = true;

        cartBtn.classList.add(
          'is-loading'
        );

        cartBtn.innerHTML = `
          <span class="btn-spinner"></span>
          <span>Adding...</span>
        `;


        // API request
        await apiRequest('/cart', {

          method: 'POST',

          body: {
            productId: productId,
            quantity: 1
          }

        });


        // Success state
        cartBtn.classList.remove(
          'is-loading'
        );

        cartBtn.classList.add(
          'added'
        );


        cartBtn.innerHTML = `
          <span>✓</span>
          <span>Added to Cart</span>
        `;


        showToast(
          'Product added to cart 🛒',
          'success'
        );


        // Update navbar cart badge
        if (
          typeof updateNavBadges ===
          'function'
        ) {
          updateNavBadges();
        }


        // Restore button
        setTimeout(() => {

          if (
            document.body.contains(
              cartBtn
            )
          ) {

            cartBtn.classList.remove(
              'added'
            );

            cartBtn.disabled = false;

            cartBtn.innerHTML =
              originalHTML;
          }

        }, 1600);


      } catch (err) {

        cartBtn.classList.remove(
          'is-loading'
        );

        cartBtn.disabled = false;

        cartBtn.innerHTML =
          originalHTML;


        showToast(
          err.message ||
            'Unable to add product to cart',
          'error'
        );
      }


      return;
    }


    // ==================================================
    // WISHLIST
    // ==================================================

    if (wishBtn) {

      if (!requireLogin()) {
        return;
      }


      const productId =
        wishBtn.dataset.id;


      if (!productId) {
        return;
      }


      if (
        wishBtn.dataset.loading ===
        'true'
      ) {
        return;
      }


      const icon =
        wishBtn.querySelector(
          '.wishlist-icon'
        );


      try {

        wishBtn.dataset.loading =
          'true';

        wishBtn.classList.add(
          'is-loading'
        );


        // API request
        await apiRequest(
          '/wishlist',
          {
            method: 'POST',

            body: {
              productId: productId
            }
          }
        );


        wishBtn.classList.remove(
          'is-loading'
        );

        wishBtn.classList.add(
          'active'
        );


        if (icon) {

          icon.textContent = '♥';

        } else {

          wishBtn.textContent = '♥';

        }


        wishBtn.title =
          'Added to wishlist';

        wishBtn.setAttribute(
          'aria-label',
          'Remove from wishlist'
        );


        showToast(
          'Added to wishlist ♥',
          'success'
        );


        // Update navbar wishlist badge
        if (
          typeof updateNavBadges ===
          'function'
        ) {
          updateNavBadges();
        }


      } catch (err) {

        wishBtn.classList.remove(
          'is-loading'
        );


        showToast(
          err.message ||
            'Unable to update wishlist',
          'error'
        );


      } finally {

        wishBtn.dataset.loading =
          'false';

      }
    }

  });
}


// ==================================================
// MARK WISHLIST PRODUCTS
// ==================================================

function markProductWishlist(
  productId,
  active = true
) {

  if (!productId) {
    return;
  }


  const buttons =
    document.querySelectorAll(
      `[data-action="wishlist"][data-id="${CSS.escape(
        String(productId)
      )}"]`
    );


  buttons.forEach((button) => {

    const icon =
      button.querySelector(
        '.wishlist-icon'
      );


    button.classList.toggle(
      'active',
      active
    );


    button.title =
      active
        ? 'Added to wishlist'
        : 'Add to wishlist';


    button.setAttribute(
      'aria-label',
      active
        ? 'Remove from wishlist'
        : 'Add to wishlist'
    );


    if (icon) {

      icon.textContent =
        active ? '♥' : '♡';

    } else {

      button.textContent =
        active ? '♥' : '♡';

    }

  });
}


// ==================================================
// OPTIONAL: UPDATE ALL WISHLIST BUTTONS
// ==================================================

function updateProductWishlistButtons(
  wishlistProducts = []
) {

  if (
    !Array.isArray(
      wishlistProducts
    )
  ) {
    return;
  }


  const wishlistIds =
    new Set(
      wishlistProducts.map((item) => {

        if (
          typeof item === 'string'
        ) {
          return item;
        }

        return (
          item._id ||
          item.product?._id ||
          item.productId
        );
      })
    );


  document
    .querySelectorAll(
      '[data-action="wishlist"]'
    )
    .forEach((button) => {

      const productId =
        button.dataset.id;

      markProductWishlist(
        productId,
        wishlistIds.has(
          productId
        )
      );

    });
}