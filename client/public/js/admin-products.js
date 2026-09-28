// ==============================
// admin-products.js
// NM Store - Product Management
// ==============================

let adminCategories = [];
let adminBrands = [];


// ==============================
// RENDER PRODUCTS TAB
// ==============================

async function renderProductsTab() {

  try {

    const [
      categoryData,
      brandData,
      productData
    ] = await Promise.all([
      apiRequest('/categories'),
      apiRequest('/brands'),
      apiRequest('/products?limit=100')
    ]);


    adminCategories =
      categoryData.categories || [];

    adminBrands =
      brandData.brands || [];


    const products =
      productData.products || [];


    adminContent().innerHTML = `

      <!-- ==========================
           PAGE HEADER
      =========================== -->

      <div class="admin-page-header">

        <div>

          <span class="section-badge">
            📦 CATALOG MANAGEMENT
          </span>

          <h1>
            Manage Products
          </h1>

          <p>
            Add, edit and manage products
            available in your NM Store catalog.
          </p>

        </div>

        <button
          class="btn btn-primary"
          id="add-product-btn"
          type="button"
        >
          + Add Product
        </button>

      </div>


      <!-- ==========================
           PRODUCT FORM
      =========================== -->

      <div id="product-form-wrap"></div>


      <!-- ==========================
           PRODUCT TOOLBAR
      =========================== -->

      <div class="admin-product-toolbar">

        <div class="admin-product-count">

          <span class="admin-toolbar-icon">
            📦
          </span>

          <div>
            <strong>
              ${products.length}
            </strong>

            <small>
              Products loaded
            </small>
          </div>

        </div>


        <div class="admin-product-hint">
          Manage your catalog from one place
        </div>

      </div>


      <!-- ==========================
           PRODUCTS TABLE
      =========================== -->

      <div class="card admin-products-card">

        <div class="admin-card-header">

          <div>

            <h3>
              Product Catalog
            </h3>

            <p>
              Your current store products
            </p>

          </div>

          <span class="admin-card-icon">
            🛍️
          </span>

        </div>


        <div class="admin-table-wrapper">

          <table class="admin-products-table">

            <thead>

              <tr>

                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Actions</th>

              </tr>

            </thead>

            <tbody id="admin-products-tbody"></tbody>

          </table>

        </div>

      </div>

    `;


    renderProductsTable(products);


    document
      .getElementById('add-product-btn')
      .addEventListener(
        'click',
        () => showProductForm(null)
      );


  } catch (err) {

    console.error(
      'Products tab error:',
      err
    );

    adminContent().innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h3>
          Unable to load products
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
          onclick="renderProductsTab()"
        >
          Try Again
        </button>

      </div>

    `;

  }
}


// ==============================
// RENDER PRODUCT TABLE
// ==============================

function renderProductsTable(products) {

  const tbody =
    document.getElementById(
      'admin-products-tbody'
    );

  if (!tbody) return;


  if (!products || products.length === 0) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="6"
          class="admin-table-empty"
        >

          <div class="admin-no-data">

            <span>
              📦
            </span>

            <h3>
              No products yet
            </h3>

            <p>
              Add your first product to
              start building your catalog.
            </p>

          </div>

        </td>

      </tr>

    `;

    return;
  }


  tbody.innerHTML = products
    .map((product) => {

      const image =
        product.images &&
        product.images.length > 0
          ? product.images[0]
          : 'https://placehold.co/80x80?text=No+Image';


      const finalPrice =
        product.discountPrice > 0
          ? product.discountPrice
          : product.price;


      const hasDiscount =
        product.discountPrice > 0 &&
        product.discountPrice < product.price;


      const stock =
        Number(product.stock) || 0;


      let stockClass = 'stock-good';
      let stockText = `${stock} available`;


      if (stock === 0) {

        stockClass = 'stock-out';
        stockText = 'Out of stock';

      } else if (stock <= 5) {

        stockClass = 'stock-warning';
        stockText = `${stock} left`;

      }


      return `

        <tr>

          <!-- Product -->

          <td>

            <div class="admin-product-info">

              <div class="admin-product-image">

                <img
                  src="${escapeHtml(image)}"
                  alt="${escapeHtml(
                    product.name || 'Product'
                  )}"
                  loading="lazy"
                />

              </div>


              <div class="admin-product-name">

                <strong>
                  ${escapeHtml(
                    product.name || 'Unnamed Product'
                  )}
                </strong>

                <small>
                  SKU:
                  ${escapeHtml(
                    product.sku || 'Auto'
                  )}
                </small>

              </div>

            </div>

          </td>


          <!-- Category -->

          <td>

            <span class="admin-category-pill">

              ${
                product.category
                  ? escapeHtml(
                      product.category.name
                    )
                  : 'Uncategorized'
              }

            </span>

          </td>


          <!-- Price -->

          <td>

            <div class="admin-price">

              <strong>
                ${formatPrice(finalPrice)}
              </strong>

              ${
                hasDiscount
                  ? `
                    <small>
                      ${formatPrice(
                        product.price
                      )}
                    </small>
                  `
                  : ''
              }

            </div>

          </td>


          <!-- Stock -->

          <td>

            <span
              class="${stockClass}"
            >
              ${stockText}
            </span>

          </td>


          <!-- Featured -->

          <td>

            ${
              product.isFeatured
                ? `
                  <span class="featured-product">
                    ⭐ Featured
                  </span>
                `
                : `
                  <span class="not-featured">
                    —
                  </span>
                `
            }

          </td>


          <!-- Actions -->

          <td>

            <div class="admin-product-actions">

              <button
                class="btn btn-sm btn-outline edit-product-btn"
                data-id="${product._id}"
                type="button"
              >
                ✏️ Edit
              </button>

              <button
                class="btn btn-sm btn-danger delete-product-btn"
                data-id="${product._id}"
                type="button"
              >
                🗑️ Delete
              </button>

            </div>

          </td>

        </tr>

      `;

    })
    .join('');


  // ==============================
  // EDIT BUTTONS
  // ==============================

  tbody
    .querySelectorAll(
      '.edit-product-btn'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        async () => {

          const originalText =
            button.textContent;

          button.disabled = true;
          button.textContent =
            'Loading...';


          try {

            const { product } =
              await apiRequest(
                `/products/${button.dataset.id}`
              );

            showProductForm(product);

          } catch (err) {

            showToast(
              err.message ||
              'Unable to load product',
              'error'
            );

            button.disabled = false;
            button.textContent =
              originalText;

          }

        }
      );

    });


  // ==============================
  // DELETE BUTTONS
  // ==============================

  tbody
    .querySelectorAll(
      '.delete-product-btn'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        async () => {

          if (
            !confirmAction(
              'Delete this product permanently?'
            )
          ) {
            return;
          }


          const originalText =
            button.textContent;

          button.disabled = true;
          button.textContent =
            'Deleting...';


          try {

            await apiRequest(
              `/products/${button.dataset.id}`,
              {
                method: 'DELETE'
              }
            );


            showToast(
              'Product deleted successfully',
              'success'
            );


            await renderProductsTab();

          } catch (err) {

            showToast(
              err.message ||
              'Unable to delete product',
              'error'
            );

            button.disabled = false;
            button.textContent =
              originalText;

          }

        }
      );

    });

}


// ==============================
// PRODUCT FORM
// ==============================

function showProductForm(product) {

  const isEdit =
    Boolean(product);

  const wrap =
    document.getElementById(
      'product-form-wrap'
    );

  if (!wrap) return;


  wrap.innerHTML = `

    <div class="card admin-product-form-card">

      <!-- FORM HEADER -->

      <div class="admin-form-header">

        <div>

          <span class="section-badge">
            ${isEdit
              ? '✏️ EDIT PRODUCT'
              : '➕ NEW PRODUCT'}
          </span>

          <h3>
            ${
              isEdit
                ? 'Edit Product'
                : 'Add New Product'
            }
          </h3>

          <p>
            ${
              isEdit
                ? 'Update product information and inventory.'
                : 'Add a new product to your NM Store catalog.'
            }
          </p>

        </div>

        <button
          type="button"
          class="admin-form-close"
          id="cancel-product-form"
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <!-- FORM -->

      <form
        id="product-form"
        class="admin-product-form"
      >


        <!-- BASIC INFORMATION -->

        <div class="admin-form-section">

          <h4>
            Basic Information
          </h4>

          <div class="admin-form-grid">


            <div class="form-group">

              <label for="p-name">
                Product Name
              </label>

              <input
                type="text"
                id="p-name"
                placeholder="Enter product name"
                required
                maxlength="120"
                value="${
                  isEdit
                    ? escAttr(product.name)
                    : ''
                }"
              />

            </div>


            <div class="form-group">

              <label>
                SKU
              </label>

              <input
                type="text"
                disabled
                value="${
                  isEdit
                    ? escAttr(product.sku)
                    : 'Auto-generated'
                }"
              />

            </div>


          </div>


          <div class="form-group">

            <label for="p-description">
              Description
            </label>

            <textarea
              id="p-description"
              rows="4"
              placeholder="Describe the product..."
              required
            >${
              isEdit
                ? escapeHtml(
                    product.description
                  )
                : ''
            }</textarea>

          </div>

        </div>


        <!-- PRICE + INVENTORY -->

        <div class="admin-form-section">

          <h4>
            Price & Inventory
          </h4>

          <div class="admin-form-grid admin-form-grid-3">


            <div class="form-group">

              <label for="p-price">
                Price (₹)
              </label>

              <input
                type="number"
                id="p-price"
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                value="${
                  isEdit
                    ? product.price
                    : ''
                }"
              />

            </div>


            <div class="form-group">

              <label for="p-discount">
                Discount Price (₹)
              </label>

              <input
                type="number"
                id="p-discount"
                min="0"
                step="0.01"
                placeholder="Optional"
                value="${
                  isEdit &&
                  product.discountPrice
                    ? product.discountPrice
                    : ''
                }"
              />

            </div>


            <div class="form-group">

              <label for="p-stock">
                Stock Quantity
              </label>

              <input
                type="number"
                id="p-stock"
                min="0"
                step="1"
                placeholder="0"
                required
                value="${
                  isEdit
                    ? product.stock
                    : ''
                }"
              />

            </div>


          </div>

        </div>


        <!-- CATEGORY + BRAND -->

        <div class="admin-form-section">

          <h4>
            Catalog Organization
          </h4>

          <div class="admin-form-grid">


            <div class="form-group">

              <label for="p-category">
                Category
              </label>

              <select
                id="p-category"
                required
              >

                <option value="">
                  Select category
                </option>

                ${adminCategories
                  .map(
                    (category) => `
                      <option
                        value="${category._id}"
                        ${
                          isEdit &&
                          product.category &&
                          product.category._id ===
                            category._id
                            ? 'selected'
                            : ''
                        }
                      >
                        ${escapeHtml(
                          category.name
                        )}
                      </option>
                    `
                  )
                  .join('')}

              </select>

            </div>


            <div class="form-group">

              <label for="p-brand">
                Brand
              </label>

              <select
                id="p-brand"
              >

                <option value="">
                  Select brand
                </option>

                ${adminBrands
                  .map(
                    (brand) => `
                      <option
                        value="${brand._id}"
                        ${
                          isEdit &&
                          product.brand &&
                          product.brand._id ===
                            brand._id
                            ? 'selected'
                            : ''
                        }
                      >
                        ${escapeHtml(
                          brand.name
                        )}
                      </option>
                    `
                  )
                  .join('')}

              </select>

            </div>


          </div>


          <label class="admin-checkbox">

            <input
              type="checkbox"
              id="p-featured"
              ${
                isEdit &&
                product.isFeatured
                  ? 'checked'
                  : ''
              }
            />

            <span>
              ⭐ Mark this product as Featured
            </span>

          </label>

        </div>


        <!-- IMAGES -->

        <div class="admin-form-section">

          <h4>
            Product Images
          </h4>

          <p class="admin-form-help">
            ${
              isEdit
                ? 'Upload additional images or remove existing ones.'
                : 'Select one or more product images.'
            }
          </p>


          <div class="admin-upload-box">

            <input
              type="file"
              id="p-images"
              accept="image/*"
              multiple
            />

            <div class="upload-icon">
              📸
            </div>

            <strong>
              Choose Product Images
            </strong>

            <small>
              JPG, PNG, WEBP and other image formats
            </small>

          </div>


          ${
            isEdit &&
            product.images &&
            product.images.length > 0
              ? `

                <div class="existing-images">

                  <h5>
                    Current Images
                  </h5>

                  <div class="admin-image-grid">

                    ${product.images
                      .map(
                        (image) => `

                          <div
                            class="admin-image-preview"
                          >

                            <img
                              src="${escapeHtml(
                                image
                              )}"
                              alt="Product image"
                            />

                            <button
                              type="button"
                              class="remove-img-btn"
                              data-img="${escAttr(
                                image
                              )}"
                              title="Remove image"
                            >
                              ×
                            </button>

                          </div>

                        `
                      )
                      .join('')}

                  </div>

                </div>

              `
              : ''
          }

        </div>


        <!-- ACTIONS -->

        <div class="admin-form-actions">

          <button
            type="submit"
            class="btn btn-primary"
            id="save-product-btn"
          >
            ${
              isEdit
                ? '✓ Update Product'
                : '+ Create Product'
            }
          </button>


          <button
            type="button"
            class="btn btn-outline"
            id="cancel-product-form-bottom"
          >
            Cancel
          </button>

        </div>

      </form>

    </div>

  `;


  // ==============================
  // CANCEL FORM
  // ==============================

  const closeForm = () => {

    wrap.innerHTML = '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  };


  document
    .getElementById(
      'cancel-product-form'
    )
    .addEventListener(
      'click',
      closeForm
    );


  document
    .getElementById(
      'cancel-product-form-bottom'
    )
    .addEventListener(
      'click',
      closeForm
    );


  // ==============================
  // REMOVE EXISTING IMAGE
  // ==============================

  wrap
    .querySelectorAll(
      '.remove-img-btn'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        async () => {

          if (
            !confirmAction(
              'Remove this image?'
            )
          ) {
            return;
          }


          button.disabled = true;

          try {

            await apiRequest(
              `/products/${product._id}/images`,
              {
                method: 'DELETE',
                body: {
                  imageUrl:
                    button.dataset.img
                }
              }
            );


            showToast(
              'Image removed successfully',
              'success'
            );


            const {
              product: updatedProduct
            } = await apiRequest(
              `/products/${product._id}`
            );


            showProductForm(
              updatedProduct
            );

          } catch (err) {

            showToast(
              err.message ||
              'Unable to remove image',
              'error'
            );

            button.disabled = false;

          }

        }
      );

    });


  // ==============================
  // FORM SUBMIT
  // ==============================

  document
    .getElementById('product-form')
    .addEventListener(
      'submit',
      async (event) => {

        event.preventDefault();


        const saveButton =
          document.getElementById(
            'save-product-btn'
          );


        const name =
          document
            .getElementById('p-name')
            .value
            .trim();

        const description =
          document
            .getElementById(
              'p-description'
            )
            .value
            .trim();

        const price =
          document.getElementById(
            'p-price'
          ).value;

        const discountPrice =
          document.getElementById(
            'p-discount'
          ).value || 0;

        const stock =
          document.getElementById(
            'p-stock'
          ).value;

        const category =
          document.getElementById(
            'p-category'
          ).value;

        const brand =
          document.getElementById(
            'p-brand'
          ).value;

        const isFeatured =
          document.getElementById(
            'p-featured'
          ).checked;


        // ==========================
        // BASIC VALIDATION
        // ==========================

        if (!name) {

          showToast(
            'Please enter a product name',
            'error'
          );

          return;

        }


        if (!description) {

          showToast(
            'Please enter a product description',
            'error'
          );

          return;

        }


        if (
          price === '' ||
          Number(price) < 0
        ) {

          showToast(
            'Please enter a valid price',
            'error'
          );

          return;

        }


        if (
          discountPrice !== '' &&
          Number(discountPrice) < 0
        ) {

          showToast(
            'Discount price cannot be negative',
            'error'
          );

          return;

        }


        if (
          Number(discountPrice) > 0 &&
          Number(discountPrice) >= Number(price)
        ) {

          showToast(
            'Discount price should be lower than the original price',
            'error'
          );

          return;

        }


        if (
          stock === '' ||
          Number(stock) < 0
        ) {

          showToast(
            'Please enter a valid stock quantity',
            'error'
          );

          return;

        }


        if (!category) {

          showToast(
            'Please select a category',
            'error'
          );

          return;

        }


        // ==========================
        // FORM DATA
        // ==========================

        const formData =
          new FormData();


        formData.append(
          'name',
          name
        );

        formData.append(
          'description',
          description
        );

        formData.append(
          'price',
          price
        );

        formData.append(
          'discountPrice',
          discountPrice
        );

        formData.append(
          'stock',
          stock
        );

        formData.append(
          'category',
          category
        );

        formData.append(
          'brand',
          brand
        );

        formData.append(
          'isFeatured',
          isFeatured
        );


        // ==========================
        // IMAGE FILES
        // ==========================

        const files =
          document
            .getElementById(
              'p-images'
            )
            .files;


        for (
          let index = 0;
          index < files.length;
          index++
        ) {

          formData.append(
            'images',
            files[index]
          );

        }


        // ==========================
        // SAVE
        // ==========================

        saveButton.disabled = true;

        saveButton.textContent =
          isEdit
            ? 'Updating...'
            : 'Creating...';


        try {

          if (isEdit) {

            await apiRequest(
              `/products/${product._id}`,
              {
                method: 'PUT',
                body: formData,
                isForm: true
              }
            );


            showToast(
              'Product updated successfully',
              'success'
            );

          } else {

            await apiRequest(
              '/products',
              {
                method: 'POST',
                body: formData,
                isForm: true
              }
            );


            showToast(
              'Product created successfully',
              'success'
            );

          }


          await renderProductsTab();

        } catch (err) {

          console.error(
            'Product save error:',
            err
          );


          showToast(
            err.message ||
            'Unable to save product',
            'error'
          );


          saveButton.disabled = false;

          saveButton.textContent =
            isEdit
              ? '✓ Update Product'
              : '+ Create Product';

        }

      }
    );

}


// ==============================
// ESCAPE ATTRIBUTE
// ==============================

function escAttr(value) {

  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

}