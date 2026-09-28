// ==============================
// product-detail.js
// Premium Product Detail Page
// ==============================

const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

let selectedQuantity = 1;
let currentProduct = null;


// ==================================================
// RENDER PRODUCT DETAIL
// ==================================================

function renderProductDetail(product) {

  currentProduct = product;

  const price = Number(product.price) || 0;
  const discountPrice = Number(product.discountPrice) || 0;

  const hasDiscount =
    discountPrice > 0 &&
    discountPrice < price;

  const finalPrice =
    hasDiscount
      ? discountPrice
      : price;

  const discountPercent =
    hasDiscount
      ? Math.round(
          ((price - discountPrice) / price) * 100
        )
      : 0;

  const images =
    product.images &&
    product.images.length > 0
      ? product.images
      : [
          'https://placehold.co/700x700?text=No+Image'
        ];

  const stock =
    Number(product.stock) || 0;

  selectedQuantity = 1;

  const root =
    document.getElementById(
      'product-detail-root'
    );

  if (!root) return;


  root.innerHTML = `

    <div class="premium-product-detail">

      <!-- ==================================
           PRODUCT IMAGE AREA
      =================================== -->

      <div class="pd-gallery">

        <div class="pd-main-image-card">

          ${
            hasDiscount
              ? `
                <span class="pd-sale-badge">
                  ${discountPercent}% OFF
                </span>
              `
              : ''
          }

          <button
            type="button"
            class="pd-image-zoom"
            id="image-zoom-btn"
            title="View larger image"
          >
            ⛶
          </button>

          <img
            id="main-image"
            src="${escapeHtml(images[0])}"
            alt="${escapeHtml(product.name)}"
            class="pd-main-image"
            onerror="
              this.onerror=null;
              this.src='https://placehold.co/700x700?text=No+Image';
            "
          />

        </div>


        <!-- Thumbnails -->

        <div class="pd-thumbnails">

          ${images
            .map(
              (image, index) => `
                <button
                  type="button"
                  class="pd-thumb ${
                    index === 0
                      ? 'active'
                      : ''
                  }"
                  data-index="${index}"
                >
                  <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(
                      product.name
                    )} image ${index + 1}"
                    loading="lazy"
                    onerror="
                      this.onerror=null;
                      this.src='https://placehold.co/100x100?text=Image';
                    "
                  />
                </button>
              `
            )
            .join('')}

        </div>

      </div>


      <!-- ==================================
           PRODUCT INFORMATION
      =================================== -->

      <div class="pd-information">

        <!-- Category + Brand -->

        <div class="pd-meta">

          ${
            product.category
              ? `
                <span class="pd-category">
                  ${escapeHtml(
                    product.category.name
                  )}
                </span>
              `
              : ''
          }

          ${
            product.brand
              ? `
                <span class="pd-separator">
                  •
                </span>

                <span class="pd-brand">
                  ${escapeHtml(
                    product.brand.name
                  )}
                </span>
              `
              : ''
          }

        </div>


        <!-- Product Name -->

        <h1 class="pd-title">
          ${escapeHtml(product.name)}
        </h1>


        <!-- Rating -->

        <div class="pd-rating-row">

          <span class="pd-stars">
            ${renderStars(
              product.ratingsAverage || 0
            )}
          </span>

          <span class="pd-rating-value">
            ${Number(
              product.ratingsAverage || 0
            ).toFixed(1)}
          </span>

          <a
            href="#reviews-section"
            class="pd-review-link"
          >
            ${Number(
              product.ratingsCount || 0
            ).toLocaleString()}
            reviews
          </a>

        </div>


        <div class="pd-divider"></div>


        <!-- Price -->

        <div class="pd-price-section">

          <span class="pd-current-price">
            ${formatPrice(finalPrice)}
          </span>

          ${
            hasDiscount
              ? `
                <span class="pd-old-price">
                  ${formatPrice(price)}
                </span>

                <span class="pd-discount">
                  Save ${discountPercent}%
                </span>
              `
              : ''
          }

        </div>


        ${
          hasDiscount
            ? `
              <p class="pd-saving-text">
                You save
                <strong>
                  ${formatPrice(
                    price - finalPrice
                  )}
                </strong>
              </p>
            `
            : ''
        }


        <!-- Description -->

        <div class="pd-description">

          <h3>
            About this product
          </h3>

          <p>
            ${escapeHtml(
              product.description ||
                'No description available.'
            )}
          </p>

        </div>


        <!-- Stock -->

        <div
          class="pd-stock ${
            stock === 0
              ? 'out'
              : stock <= 5
                ? 'low'
                : 'available'
          }"
        >

          <span class="pd-stock-dot"></span>

          ${
            stock === 0
              ? 'Currently unavailable'
              : stock <= 5
                ? `Only ${stock} left in stock`
                : 'In stock and ready to ship'
          }

        </div>


        <!-- Quantity -->

        <div class="pd-quantity-section">

          <label>
            Quantity
          </label>

          <div class="pd-quantity-control">

            <button
              type="button"
              id="qty-minus"
              aria-label="Decrease quantity"
              ${stock === 0 ? 'disabled' : ''}
            >
              −
            </button>

            <span
              id="qty-value"
              aria-live="polite"
            >
              1
            </span>

            <button
              type="button"
              id="qty-plus"
              aria-label="Increase quantity"
              ${stock === 0 ? 'disabled' : ''}
            >
              +
            </button>

          </div>

        </div>


        <!-- Actions -->

        <div class="pd-actions">

          <button
            type="button"
            class="btn btn-primary pd-cart-button"
            id="add-to-cart-btn"
            ${stock === 0 ? 'disabled' : ''}
          >

            <span class="pd-cart-icon">
              🛒
            </span>

            <span>
              ${
                stock === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'
              }
            </span>

          </button>


          <button
            type="button"
            class="btn btn-outline pd-wishlist-button"
            id="add-to-wishlist-btn"
          >

            <span>
              ♡
            </span>

            Wishlist

          </button>

        </div>


        <!-- Benefits -->

        <div class="pd-benefits">

          <div class="pd-benefit">

            <span class="pd-benefit-icon">
              🚚
            </span>

            <div>
              <strong>
                Fast Delivery
              </strong>

              <small>
                Quick delivery to your doorstep
              </small>
            </div>

          </div>


          <div class="pd-benefit">

            <span class="pd-benefit-icon">
              🔒
            </span>

            <div>
              <strong>
                Secure Shopping
              </strong>

              <small>
                Your information is protected
              </small>
            </div>

          </div>


          <div class="pd-benefit">

            <span class="pd-benefit-icon">
              ↩️
            </span>

            <div>
              <strong>
                Easy Returns
              </strong>

              <small>
                Shop with confidence
              </small>
            </div>

          </div>

        </div>


        <!-- SKU -->

        <div class="pd-sku">

          <span>
            SKU
          </span>

          <strong>
            ${escapeHtml(
              product.sku || 'N/A'
            )}
          </strong>

        </div>

      </div>

    </div>


    <!-- ==================================
         IMAGE LIGHTBOX
    =================================== -->

    <div
      class="pd-lightbox"
      id="pd-lightbox"
      aria-hidden="true"
    >

      <button
        type="button"
        class="pd-lightbox-close"
        id="pd-lightbox-close"
        aria-label="Close image"
      >
        ×
      </button>

      <img
        id="pd-lightbox-image"
        src="${escapeHtml(images[0])}"
        alt="${escapeHtml(product.name)}"
      />

    </div>

  `;


  setupGallery(images);

  setupQuantity(stock);

  setupCartButton(product);

  setupWishlistButton(product);

  setupImageLightbox(images);

}


// ==================================================
// IMAGE GALLERY
// ==================================================

function setupGallery(images) {

  const mainImage =
    document.getElementById(
      'main-image'
    );

  const thumbnails =
    document.querySelectorAll(
      '.pd-thumb'
    );


  if (!mainImage) return;


  thumbnails.forEach(
    (thumbnail) => {

      thumbnail.addEventListener(
        'click',
        () => {

          const index =
            Number(
              thumbnail.dataset.index
            );

          if (
            !images[index]
          ) {
            return;
          }


          mainImage.style.opacity =
            '0.35';


          setTimeout(() => {

            mainImage.src =
              images[index];

            mainImage.style.opacity =
              '1';

          }, 100);


          thumbnails.forEach(
            (item) => {

              item.classList.remove(
                'active'
              );

            }
          );


          thumbnail.classList.add(
            'active'
          );

        }
      );

    }
  );

}


// ==================================================
// QUANTITY
// ==================================================

function setupQuantity(stock) {

  const minus =
    document.getElementById(
      'qty-minus'
    );

  const plus =
    document.getElementById(
      'qty-plus'
    );

  const value =
    document.getElementById(
      'qty-value'
    );


  if (
    !minus ||
    !plus ||
    !value
  ) {
    return;
  }


  minus.addEventListener(
    'click',
    () => {

      if (
        selectedQuantity > 1
      ) {

        selectedQuantity--;

        value.textContent =
          selectedQuantity;

      }

    }
  );


  plus.addEventListener(
    'click',
    () => {

      if (
        selectedQuantity <
        stock
      ) {

        selectedQuantity++;

        value.textContent =
          selectedQuantity;

      } else {

        showToast(
          `Only ${stock} item${
            stock === 1
              ? ''
              : 's'
          } available`,
          'error'
        );

      }

    }
  );

}


// ==================================================
// ADD TO CART
// ==================================================

function setupCartButton(product) {

  const button =
    document.getElementById(
      'add-to-cart-btn'
    );


  if (!button) return;


  button.addEventListener(
    'click',
    async () => {

      if (
        !requireLogin()
      ) {
        return;
      }


      if (
        !product.stock
      ) {
        return;
      }


      const originalHTML =
        button.innerHTML;


      try {

        button.disabled =
          true;

        button.classList.add(
          'is-loading'
        );


        button.innerHTML = `
          <span class="btn-spinner"></span>
          <span>
            Adding...
          </span>
        `;


        await apiRequest(
          '/cart',
          {
            method: 'POST',

            body: {
              productId:
                product._id,

              quantity:
                selectedQuantity
            }
          }
        );


        button.classList.remove(
          'is-loading'
        );

        button.classList.add(
          'added'
        );


        button.innerHTML = `
          <span>
            ✓
          </span>

          <span>
            Added to Cart
          </span>
        `;


        showToast(
          `${
            selectedQuantity
          } item${
            selectedQuantity === 1
              ? ''
              : 's'
          } added to cart 🛒`,
          'success'
        );


        updateNavBadges();


        setTimeout(
          () => {

            if (
              document.body.contains(
                button
              )
            ) {

              button.disabled =
                false;

              button.classList.remove(
                'added'
              );

              button.innerHTML =
                originalHTML;

            }

          },
          1800
        );


      } catch (err) {

        button.disabled =
          false;

        button.classList.remove(
          'is-loading'
        );

        button.innerHTML =
          originalHTML;


        showToast(
          err.message ||
            'Unable to add product to cart',
          'error'
        );

      }

    }
  );

}


// ==================================================
// WISHLIST
// ==================================================

function setupWishlistButton(
  product
) {

  const button =
    document.getElementById(
      'add-to-wishlist-btn'
    );


  if (!button) return;


  button.addEventListener(
    'click',
    async () => {

      if (
        !requireLogin()
      ) {
        return;
      }


      if (
        button.dataset.loading ===
        'true'
      ) {
        return;
      }


      const originalHTML =
        button.innerHTML;


      try {

        button.dataset.loading =
          'true';

        button.disabled =
          true;


        button.innerHTML = `
          <span class="btn-spinner"></span>
          Adding...
        `;


        await apiRequest(
          '/wishlist',
          {
            method: 'POST',

            body: {
              productId:
                product._id
            }
          }
        );


        button.classList.add(
          'active'
        );


        button.innerHTML = `
          <span>
            ♥
          </span>

          Added to Wishlist
        `;


        showToast(
          'Added to wishlist ♥',
          'success'
        );


        updateNavBadges();


      } catch (err) {

        button.disabled =
          false;

        button.innerHTML =
          originalHTML;


        showToast(
          err.message ||
            'Unable to update wishlist',
          'error'
        );


      } finally {

        button.dataset.loading =
          'false';

      }

    }
  );

}


// ==================================================
// IMAGE LIGHTBOX
// ==================================================

function setupImageLightbox(
  images
) {

  const zoomButton =
    document.getElementById(
      'image-zoom-btn'
    );

  const lightbox =
    document.getElementById(
      'pd-lightbox'
    );

  const lightboxImage =
    document.getElementById(
      'pd-lightbox-image'
    );

  const closeButton =
    document.getElementById(
      'pd-lightbox-close'
    );

  const mainImage =
    document.getElementById(
      'main-image'
    );


  if (
    !zoomButton ||
    !lightbox ||
    !lightboxImage
  ) {
    return;
  }


  function openLightbox() {

    lightboxImage.src =
      mainImage.src;

    lightbox.classList.add(
      'open'
    );

    lightbox.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.classList.add(
      'lightbox-open'
    );

  }


  function closeLightbox() {

    lightbox.classList.remove(
      'open'
    );

    lightbox.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.classList.remove(
      'lightbox-open'
    );

  }


  zoomButton.addEventListener(
    'click',
    openLightbox
  );


  mainImage.addEventListener(
    'click',
    openLightbox
  );


  if (closeButton) {

    closeButton.addEventListener(
      'click',
      closeLightbox
    );

  }


  lightbox.addEventListener(
    'click',
    (e) => {

      if (
        e.target ===
        lightbox
      ) {

        closeLightbox();

      }

    }
  );


  document.addEventListener(
    'keydown',
    (e) => {

      if (
        e.key === 'Escape'
      ) {

        closeLightbox();

      }

    }
  );

}


// ==================================================
// REVIEW FORM
// ==================================================

function renderReviewForm() {

  const container =
    document.getElementById(
      'review-form-container'
    );


  if (!container) {
    return;
  }


  if (
    !Auth.isLoggedIn()
  ) {

    container.innerHTML = `

      <div class="review-login-message">

        <span>
          ✍️
        </span>

        <div>

          <strong>
            Want to share your experience?
          </strong>

          <p>
            Please
            <a href="/login">
              log in
            </a>
            to write a review.
          </p>

        </div>

      </div>

    `;

    return;
  }


  container.innerHTML = `

    <div class="card premium-review-form">

      <div class="review-form-header">

        <div>

          <span class="review-form-icon">
            ✨
          </span>

          <div>

            <h3>
              Write a Review
            </h3>

            <p>
              Tell other shoppers what you think.
            </p>

          </div>

        </div>

      </div>


      <div class="form-group">

        <label>
          Your Rating
        </label>

        <div
          id="star-input"
          class="review-star-input"
        >

          ${[1, 2, 3, 4, 5]
            .map(
              (number) => `
                <button
                  type="button"
                  class="review-star"
                  data-value="${number}"
                  aria-label="${number} star"
                >
                  ☆
                </button>
              `
            )
            .join('')}

        </div>

      </div>


      <div class="form-group">

        <label>
          Your Comment
        </label>

        <textarea
          id="review-comment"
          rows="4"
          maxlength="1000"
          placeholder="Share your experience with this product..."
        ></textarea>

      </div>


      <button
        type="button"
        class="btn btn-primary"
        id="submit-review-btn"
      >
        Submit Review
      </button>

    </div>

  `;


  let selectedRating =
    0;


  const stars =
    document.querySelectorAll(
      '.review-star'
    );


  stars.forEach(
    (star) => {

      star.addEventListener(
        'click',
        () => {

          selectedRating =
            Number(
              star.dataset.value
            );


          stars.forEach(
            (item) => {

              const value =
                Number(
                  item.dataset.value
                );

              item.textContent =
                value <=
                selectedRating
                  ? '★'
                  : '☆';

              item.classList.toggle(
                'selected',
                value <=
                  selectedRating
              );

            }
          );

        }
      );

    }
  );


  const submitButton =
    document.getElementById(
      'submit-review-btn'
    );


  submitButton.addEventListener(
    'click',
    async () => {

      const comment =
        document
          .getElementById(
            'review-comment'
          )
          .value
          .trim();


      if (
        selectedRating === 0
      ) {

        showToast(
          'Please select a star rating',
          'error'
        );

        return;
      }


      if (!comment) {

        showToast(
          'Please enter a comment',
          'error'
        );

        return;
      }


      const originalText =
        submitButton.textContent;


      try {

        submitButton.disabled =
          true;

        submitButton.textContent =
          'Submitting...';


        await apiRequest(
          `/reviews/product/${productId}`,
          {
            method: 'POST',

            body: {
              rating:
                selectedRating,

              comment:
                comment
            }
          }
        );


        showToast(
          'Review submitted successfully ⭐',
          'success'
        );


        loadReviews();


        document.getElementById(
          'review-comment'
        ).value = '';


        selectedRating =
          0;


        stars.forEach(
          (star) => {

            star.textContent =
              '☆';

            star.classList.remove(
              'selected'
            );

          }
        );


      } catch (err) {

        showToast(
          err.message ||
            'Unable to submit review',
          'error'
        );


      } finally {

        submitButton.disabled =
          false;

        submitButton.textContent =
          originalText;

      }

    }
  );

}


// ==================================================
// LOAD REVIEWS
// ==================================================

async function loadReviews() {

  const container =
    document.getElementById(
      'reviews-list'
    );


  if (!container) {
    return;
  }


  container.innerHTML = `
    <div class="review-loading">
      Loading reviews...
    </div>
  `;


  try {

    const data =
      await apiRequest(
        `/reviews/product/${productId}`
      );


    const reviews =
      data.reviews || [];


    if (
      reviews.length === 0
    ) {

      container.innerHTML = `

        <div class="empty-reviews">

          <div>
            ⭐
          </div>

          <h3>
            No reviews yet
          </h3>

          <p>
            Be the first to review this product!
          </p>

        </div>

      `;

      return;
    }


    container.innerHTML =
      reviews
        .map(
          (review) => `

            <article
              class="review-card"
            >

              <div
                class="review-card-top"
              >

                <div
                  class="review-user"
                >

                  <div
                    class="review-avatar"
                  >
                    ${escapeHtml(
                      (
                        review.user?.name ||
                        'A'
                      )
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <div>

                    <strong>
                      ${escapeHtml(
                        review.user
                          ? review.user.name
                          : 'Anonymous'
                      )}
                    </strong>

                    <div
                      class="review-date"
                    >
                      ${new Date(
                        review.createdAt
                      ).toLocaleDateString(
                        undefined,
                        {
                          day:
                            'numeric',

                          month:
                            'short',

                          year:
                            'numeric'
                        }
                      )}
                    </div>

                  </div>

                </div>


                <div
                  class="review-rating"
                >
                  ${renderStars(
                    review.rating
                  )}
                </div>

              </div>


              <p
                class="review-comment"
              >
                ${escapeHtml(
                  review.comment
                )}
              </p>

            </article>

          `
        )
        .join('');


  } catch (err) {

    container.innerHTML = `

      <div class="empty-reviews">

        <div>
          ⚠️
        </div>

        <p>
          Could not load reviews.
        </p>

      </div>

    `;

    console.error(
      'Review loading error:',
      err
    );

  }

}


// ==================================================
// LOAD RELATED PRODUCTS
// ==================================================

async function loadRelated() {

  const container =
    document.getElementById(
      'related-products'
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    productSkeletonHTML
      ? productSkeletonHTML(4)
      : '<div class="spinner"></div>';


  try {

    const data =
      await apiRequest(
        `/products/${productId}/related`
      );


    const products =
      data.products || [];


    if (
      products.length === 0
    ) {

      container.innerHTML = `
        <div class="empty-state">
          No related products found.
        </div>
      `;

      return;
    }


    container.innerHTML =
      products
        .map(productCardHTML)
        .join('');


    attachProductCardEvents(
      container
    );


  } catch (err) {

    console.error(
      'Related products error:',
      err
    );

    container.innerHTML =
      '';

  }

}


// ==================================================
// PAGE INITIALIZATION
// ==================================================

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    const root =
      document.getElementById(
        'product-detail-root'
      );


    if (!productId) {

      if (root) {

        root.innerHTML = `

          <div class="empty-state">

            <div class="empty-icon">
              🔍
            </div>

            <h3>
              No product specified
            </h3>

            <p>
              Please select a product to view.
            </p>

            <a
              href="/products"
              class="btn btn-primary"
            >
              Browse Products
            </a>

          </div>

        `;

      }

      return;
    }


    try {

      const data =
        await apiRequest(
          `/products/${productId}`
        );


      const product =
        data.product;


      if (!product) {
        throw new Error(
          'Product not found'
        );
      }


      renderProductDetail(
        product
      );


      document.title =
        `${product.name} - NM Store`;


    } catch (err) {

      console.error(
        'Product detail error:',
        err
      );


      if (root) {

        root.innerHTML = `

          <div class="empty-state">

            <div class="empty-icon">
              😕
            </div>

            <h3>
              Product not found
            </h3>

            <p>
              This product may have been removed
              or is no longer available.
            </p>

            <a
              href="/products"
              class="btn btn-primary"
            >
              Back to Products
            </a>

          </div>

        `;

      }

      return;

    }


    // Reviews
    renderReviewForm();

    loadReviews();


    // Related products
    loadRelated();

  }
);