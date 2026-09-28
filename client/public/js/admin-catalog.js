// ==============================
// admin-catalog.js
// NM Store - Categories & Brands
// ==============================


// ======================================================
// CATEGORIES
// ======================================================

async function renderCategoriesTab() {

  try {

    const { categories } =
      await apiRequest('/categories');

    const categoryList =
      Array.isArray(categories)
        ? categories
        : [];


    adminContent().innerHTML = `

      <!-- PAGE HEADER -->

      <div class="admin-page-header">

        <div>

          <span class="section-badge">
            🗂️ CATALOG MANAGEMENT
          </span>

          <h1>
            Manage Categories
          </h1>

          <p>
            Organize your products into clear,
            easy-to-browse categories.
          </p>

        </div>


        <div class="admin-header-actions">

          <div class="admin-order-count">

            <span>
              🗂️
            </span>

            <div>

              <strong>
                ${categoryList.length}
              </strong>

              <small>
                Categories
              </small>

            </div>

          </div>


          <button
            class="btn btn-primary"
            id="add-category-btn"
            type="button"
          >
            + Add Category
          </button>

        </div>

      </div>


      <!-- FORM -->

      <div id="category-form-wrap"></div>


      <!-- CATEGORY TABLE -->

      <div class="card admin-catalog-card">

        <div class="admin-card-header">

          <div>

            <h3>
              Product Categories
            </h3>

            <p>
              Categories available in your store
            </p>

          </div>

          <span class="admin-card-icon">
            🗂️
          </span>

        </div>


        <div class="admin-table-wrapper">

          <table class="admin-catalog-table">

            <thead>

              <tr>

                <th>Category</th>
                <th>Slug</th>
                <th>Description</th>
                <th>Actions</th>

              </tr>

            </thead>

            <tbody id="admin-categories-tbody"></tbody>

          </table>

        </div>

      </div>

    `;


    renderCategoriesTable(categoryList);


    document
      .getElementById('add-category-btn')
      .addEventListener(
        'click',
        () => showCategoryForm(null)
      );


  } catch (err) {

    console.error(
      'Categories error:',
      err
    );


    adminContent().innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h3>
          Unable to load categories
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
          onclick="renderCategoriesTab()"
        >
          Try Again
        </button>

      </div>

    `;

  }

}


// ======================================================
// CATEGORY TABLE
// ======================================================

function renderCategoriesTable(categories) {

  const tbody =
    document.getElementById(
      'admin-categories-tbody'
    );

  if (!tbody) return;


  if (!categories.length) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="4"
          class="admin-table-empty"
        >

          <div class="admin-no-data">

            <span>
              🗂️
            </span>

            <h3>
              No categories yet
            </h3>

            <p>
              Create your first category
              to organize your products.
            </p>

          </div>

        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML = categories
    .map((category) => {

      const description =
        category.description ||
        'No description';


      const image =
        category.image ||
        '';


      return `

        <tr>

          <!-- CATEGORY -->

          <td>

            <div class="admin-catalog-info">

              <div class="admin-catalog-image">

                ${
                  image
                    ? `
                      <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(
                          category.name
                        )}"
                        loading="lazy"
                      />
                    `
                    : `
                      <span>
                        🗂️
                      </span>
                    `
                }

              </div>


              <div>

                <strong>
                  ${escapeHtml(
                    category.name
                  )}
                </strong>

                <small>
                  Category
                </small>

              </div>

            </div>

          </td>


          <!-- SLUG -->

          <td>

            <code class="admin-slug">
              ${escapeHtml(
                category.slug || '-'
              )}
            </code>

          </td>


          <!-- DESCRIPTION -->

          <td>

            <span class="admin-description">

              ${escapeHtml(
                description
              )}

            </span>

          </td>


          <!-- ACTIONS -->

          <td>

            <div class="admin-catalog-actions">

              <button
                class="btn btn-sm btn-outline edit-cat-btn"
                data-id="${category._id}"
                type="button"
              >
                ✏️ Edit
              </button>


              <button
                class="btn btn-sm btn-danger delete-cat-btn"
                data-id="${category._id}"
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
  // EDIT
  // ==============================

  tbody
    .querySelectorAll(
      '.edit-cat-btn'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          const category =
            categories.find(
              (item) =>
                item._id ===
                button.dataset.id
            );

          if (category) {
            showCategoryForm(category);
          }

        }
      );

    });


  // ==============================
  // DELETE
  // ==============================

  tbody
    .querySelectorAll(
      '.delete-cat-btn'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        async () => {

          if (
            !confirmAction(
              'Delete this category? Products using this category may be affected.'
            )
          ) {
            return;
          }


          button.disabled = true;

          const oldText =
            button.textContent;

          button.textContent =
            'Deleting...';


          try {

            await apiRequest(
              `/categories/${button.dataset.id}`,
              {
                method: 'DELETE'
              }
            );


            showToast(
              'Category deleted successfully',
              'success'
            );


            await renderCategoriesTab();


          } catch (err) {

            showToast(
              err.message ||
              'Unable to delete category',
              'error'
            );


            button.disabled = false;
            button.textContent =
              oldText;

          }

        }
      );

    });

}


// ======================================================
// CATEGORY FORM
// ======================================================

function showCategoryForm(category) {

  const isEdit =
    Boolean(category);

  const wrap =
    document.getElementById(
      'category-form-wrap'
    );

  if (!wrap) return;


  wrap.innerHTML = `

    <div class="card admin-catalog-form-card">

      <div class="admin-form-header">

        <div>

          <span class="section-badge">

            ${
              isEdit
                ? '✏️ EDIT CATEGORY'
                : '➕ NEW CATEGORY'
            }

          </span>

          <h3>
            ${
              isEdit
                ? 'Edit Category'
                : 'Add New Category'
            }
          </h3>

          <p>
            ${
              isEdit
                ? 'Update category information.'
                : 'Create a category for your products.'
            }
          </p>

        </div>


        <button
          type="button"
          class="admin-form-close"
          id="cancel-cat-form"
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <form
        id="category-form"
        class="admin-catalog-form"
      >


        <!-- BASIC INFO -->

        <div class="admin-form-section">

          <h4>
            Category Information
          </h4>


          <div class="admin-form-grid">

            <div class="form-group">

              <label for="c-name">
                Category Name
              </label>

              <input
                type="text"
                id="c-name"
                placeholder="e.g. Electronics"
                maxlength="80"
                required
                value="${
                  isEdit
                    ? escAttr(category.name)
                    : ''
                }"
              />

              <small class="admin-input-help">
                The category slug will be generated automatically.
              </small>

            </div>


            <div class="form-group">

              <label>
                Slug
              </label>

              <input
                type="text"
                disabled
                value="${
                  isEdit
                    ? escAttr(
                        category.slug || ''
                      )
                    : 'Auto-generated'
                }"
              />

            </div>

          </div>


          <div class="form-group">

            <label for="c-description">
              Description
            </label>

            <textarea
              id="c-description"
              rows="4"
              maxlength="300"
              placeholder="Describe this category..."
            >${
              isEdit
                ? escapeHtml(
                    category.description || ''
                  )
                : ''
            }</textarea>

          </div>

        </div>


        <!-- IMAGE -->

        <div class="admin-form-section">

          <h4>
            Category Image
          </h4>

          <p class="admin-form-help">
            Add an image to make this category
            more attractive on the storefront.
          </p>


          ${
            isEdit &&
            category.image
              ? `

                <div class="existing-catalog-image">

                  <img
                    src="${escapeHtml(
                      category.image
                    )}"
                    alt="Category image"
                  />

                  <div>

                    <strong>
                      Current Image
                    </strong>

                    <small>
                      Upload a new image to replace it.
                    </small>

                  </div>

                </div>

              `
              : ''
          }


          <div class="admin-upload-box">

            <input
              type="file"
              id="c-image"
              accept="image/*"
            />

            <div class="upload-icon">
              🖼️
            </div>

            <strong>
              Choose Category Image
            </strong>

            <small>
              JPG, PNG, WEBP and other image formats
            </small>

          </div>

        </div>


        <!-- ACTIONS -->

        <div class="admin-form-actions">

          <button
            type="submit"
            class="btn btn-primary"
            id="save-category-btn"
          >
            ${
              isEdit
                ? '✓ Update Category'
                : '+ Create Category'
            }
          </button>


          <button
            type="button"
            class="btn btn-outline"
            id="cancel-cat-form-bottom"
          >
            Cancel
          </button>

        </div>


      </form>

    </div>

  `;


  // ==============================
  // CLOSE FORM
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
      'cancel-cat-form'
    )
    .addEventListener(
      'click',
      closeForm
    );


  document
    .getElementById(
      'cancel-cat-form-bottom'
    )
    .addEventListener(
      'click',
      closeForm
    );


  // ==============================
  // SUBMIT
  // ==============================

  document
    .getElementById(
      'category-form'
    )
    .addEventListener(
      'submit',
      async (event) => {

        event.preventDefault();


        const saveButton =
          document.getElementById(
            'save-category-btn'
          );


        const name =
          document
            .getElementById(
              'c-name'
            )
            .value
            .trim();


        const description =
          document
            .getElementById(
              'c-description'
            )
            .value
            .trim();


        const imageInput =
          document.getElementById(
            'c-image'
          );


        if (!name) {

          showToast(
            'Please enter a category name',
            'error'
          );

          return;

        }


        if (name.length < 2) {

          showToast(
            'Category name must contain at least 2 characters',
            'error'
          );

          return;

        }


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


        if (
          imageInput.files &&
          imageInput.files.length > 0
        ) {

          formData.append(
            'image',
            imageInput.files[0]
          );

        }


        saveButton.disabled =
          true;

        saveButton.textContent =
          isEdit
            ? 'Updating...'
            : 'Creating...';


        try {

          if (isEdit) {

            await apiRequest(
              `/categories/${category._id}`,
              {
                method: 'PUT',
                body: formData,
                isForm: true
              }
            );


            showToast(
              'Category updated successfully',
              'success'
            );

          } else {

            await apiRequest(
              '/categories',
              {
                method: 'POST',
                body: formData,
                isForm: true
              }
            );


            showToast(
              'Category created successfully',
              'success'
            );

          }


          await renderCategoriesTab();


        } catch (err) {

          console.error(
            'Category save error:',
            err
          );


          showToast(
            err.message ||
            'Unable to save category',
            'error'
          );


          saveButton.disabled =
            false;

          saveButton.textContent =
            isEdit
              ? '✓ Update Category'
              : '+ Create Category';

        }

      }
    );

}


// ======================================================
// BRANDS
// ======================================================

async function renderBrandsTab() {

  try {

    const { brands } =
      await apiRequest('/brands');

    const brandList =
      Array.isArray(brands)
        ? brands
        : [];


    adminContent().innerHTML = `

      <!-- PAGE HEADER -->

      <div class="admin-page-header">

        <div>

          <span class="section-badge">
            🏷️ CATALOG MANAGEMENT
          </span>

          <h1>
            Manage Brands
          </h1>

          <p>
            Manage the brands available across
            your NM Store catalog.
          </p>

        </div>


        <div class="admin-header-actions">

          <div class="admin-order-count">

            <span>
              🏷️
            </span>

            <div>

              <strong>
                ${brandList.length}
              </strong>

              <small>
                Brands
              </small>

            </div>

          </div>


          <button
            class="btn btn-primary"
            id="add-brand-btn"
            type="button"
          >
            + Add Brand
          </button>

        </div>

      </div>


      <!-- FORM -->

      <div id="brand-form-wrap"></div>


      <!-- BRAND TABLE -->

      <div class="card admin-catalog-card">

        <div class="admin-card-header">

          <div>

            <h3>
              Store Brands
            </h3>

            <p>
              Brands available in your catalog
            </p>

          </div>

          <span class="admin-card-icon">
            🏷️
          </span>

        </div>


        <div class="admin-table-wrapper">

          <table class="admin-catalog-table">

            <thead>

              <tr>

                <th>Brand</th>
                <th>Slug</th>
                <th>Actions</th>

              </tr>

            </thead>

            <tbody id="admin-brands-tbody"></tbody>

          </table>

        </div>

      </div>

    `;


    renderBrandsTable(
      brandList
    );


    document
      .getElementById(
        'add-brand-btn'
      )
      .addEventListener(
        'click',
        () => showBrandForm(null)
      );


  } catch (err) {

    console.error(
      'Brands error:',
      err
    );


    adminContent().innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ⚠️
        </div>

        <h3>
          Unable to load brands
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
          onclick="renderBrandsTab()"
        >
          Try Again
        </button>

      </div>

    `;

  }

}


// ======================================================
// BRAND TABLE
// ======================================================

function renderBrandsTable(brands) {

  const tbody =
    document.getElementById(
      'admin-brands-tbody'
    );

  if (!tbody) return;


  if (!brands.length) {

    tbody.innerHTML = `

      <tr>

        <td
          colspan="3"
          class="admin-table-empty"
        >

          <div class="admin-no-data">

            <span>
              🏷️
            </span>

            <h3>
              No brands yet
            </h3>

            <p>
              Create your first brand
              for your product catalog.
            </p>

          </div>

        </td>

      </tr>

    `;

    return;

  }


  tbody.innerHTML = brands
    .map((brand) => {

      const logo =
        brand.logo ||
        '';


      return `

        <tr>

          <!-- BRAND -->

          <td>

            <div class="admin-catalog-info">

              <div class="admin-catalog-image">

                ${
                  logo
                    ? `
                      <img
                        src="${escapeHtml(logo)}"
                        alt="${escapeHtml(
                          brand.name
                        )}"
                        loading="lazy"
                      />
                    `
                    : `
                      <span>
                        🏷️
                      </span>
                    `
                }

              </div>


              <div>

                <strong>
                  ${escapeHtml(
                    brand.name
                  )}
                </strong>

                <small>
                  Brand
                </small>

              </div>

            </div>

          </td>


          <!-- SLUG -->

          <td>

            <code class="admin-slug">
              ${escapeHtml(
                brand.slug || '-'
              )}
            </code>

          </td>


          <!-- ACTIONS -->

          <td>

            <div class="admin-catalog-actions">

              <button
                class="btn btn-sm btn-outline edit-brand-btn"
                data-id="${brand._id}"
                type="button"
              >
                ✏️ Edit
              </button>


              <button
                class="btn btn-sm btn-danger delete-brand-btn"
                data-id="${brand._id}"
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
  // EDIT
  // ==============================

  tbody
    .querySelectorAll(
      '.edit-brand-btn'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          const brand =
            brands.find(
              (item) =>
                item._id ===
                button.dataset.id
            );

          if (brand) {
            showBrandForm(brand);
          }

        }
      );

    });


  // ==============================
  // DELETE
  // ==============================

  tbody
    .querySelectorAll(
      '.delete-brand-btn'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        async () => {

          if (
            !confirmAction(
              'Delete this brand? Products using this brand may be affected.'
            )
          ) {
            return;
          }


          button.disabled = true;

          const oldText =
            button.textContent;

          button.textContent =
            'Deleting...';


          try {

            await apiRequest(
              `/brands/${button.dataset.id}`,
              {
                method: 'DELETE'
              }
            );


            showToast(
              'Brand deleted successfully',
              'success'
            );


            await renderBrandsTab();


          } catch (err) {

            showToast(
              err.message ||
              'Unable to delete brand',
              'error'
            );


            button.disabled = false;

            button.textContent =
              oldText;

          }

        }
      );

    });

}


// ======================================================
// BRAND FORM
// ======================================================

function showBrandForm(brand) {

  const isEdit =
    Boolean(brand);

  const wrap =
    document.getElementById(
      'brand-form-wrap'
    );

  if (!wrap) return;


  wrap.innerHTML = `

    <div class="card admin-catalog-form-card">

      <div class="admin-form-header">

        <div>

          <span class="section-badge">

            ${
              isEdit
                ? '✏️ EDIT BRAND'
                : '➕ NEW BRAND'
            }

          </span>

          <h3>
            ${
              isEdit
                ? 'Edit Brand'
                : 'Add New Brand'
            }
          </h3>

          <p>
            ${
              isEdit
                ? 'Update brand information.'
                : 'Create a brand for your product catalog.'
            }
          </p>

        </div>


        <button
          type="button"
          class="admin-form-close"
          id="cancel-brand-form"
          aria-label="Close"
        >
          ×
        </button>

      </div>


      <form
        id="brand-form"
        class="admin-catalog-form"
      >


        <!-- BRAND INFORMATION -->

        <div class="admin-form-section">

          <h4>
            Brand Information
          </h4>


          <div class="admin-form-grid">

            <div class="form-group">

              <label for="b-name">
                Brand Name
              </label>

              <input
                type="text"
                id="b-name"
                placeholder="e.g. Samsung"
                maxlength="80"
                required
                value="${
                  isEdit
                    ? escAttr(brand.name)
                    : ''
                }"
              />

            </div>


            <div class="form-group">

              <label>
                Slug
              </label>

              <input
                type="text"
                disabled
                value="${
                  isEdit
                    ? escAttr(
                        brand.slug || ''
                      )
                    : 'Auto-generated'
                }"
              />

            </div>

          </div>

        </div>


        <!-- LOGO -->

        <div class="admin-form-section">

          <h4>
            Brand Logo
          </h4>

          <p class="admin-form-help">
            Add a logo to make your brand
            easier to recognize.
          </p>


          ${
            isEdit &&
            brand.logo
              ? `

                <div class="existing-catalog-image">

                  <img
                    src="${escapeHtml(
                      brand.logo
                    )}"
                    alt="Brand logo"
                  />

                  <div>

                    <strong>
                      Current Logo
                    </strong>

                    <small>
                      Upload a new logo to replace it.
                    </small>

                  </div>

                </div>

              `
              : ''
          }


          <div class="admin-upload-box">

            <input
              type="file"
              id="b-logo"
              accept="image/*"
            />

            <div class="upload-icon">
              🖼️
            </div>

            <strong>
              Choose Brand Logo
            </strong>

            <small>
              JPG, PNG, WEBP and other image formats
            </small>

          </div>

        </div>


        <!-- ACTIONS -->

        <div class="admin-form-actions">

          <button
            type="submit"
            class="btn btn-primary"
            id="save-brand-btn"
          >
            ${
              isEdit
                ? '✓ Update Brand'
                : '+ Create Brand'
            }
          </button>


          <button
            type="button"
            class="btn btn-outline"
            id="cancel-brand-form-bottom"
          >
            Cancel
          </button>

        </div>


      </form>

    </div>

  `;


  // ==============================
  // CLOSE
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
      'cancel-brand-form'
    )
    .addEventListener(
      'click',
      closeForm
    );


  document
    .getElementById(
      'cancel-brand-form-bottom'
    )
    .addEventListener(
      'click',
      closeForm
    );


  // ==============================
  // SUBMIT
  // ==============================

  document
    .getElementById(
      'brand-form'
    )
    .addEventListener(
      'submit',
      async (event) => {

        event.preventDefault();


        const saveButton =
          document.getElementById(
            'save-brand-btn'
          );


        const name =
          document
            .getElementById(
              'b-name'
            )
            .value
            .trim();


        const logoInput =
          document.getElementById(
            'b-logo'
          );


        if (!name) {

          showToast(
            'Please enter a brand name',
            'error'
          );

          return;

        }


        if (name.length < 2) {

          showToast(
            'Brand name must contain at least 2 characters',
            'error'
          );

          return;

        }


        const formData =
          new FormData();


        formData.append(
          'name',
          name
        );


        if (
          logoInput.files &&
          logoInput.files.length > 0
        ) {

          formData.append(
            'logo',
            logoInput.files[0]
          );

        }


        saveButton.disabled =
          true;

        saveButton.textContent =
          isEdit
            ? 'Updating...'
            : 'Creating...';


        try {

          if (isEdit) {

            await apiRequest(
              `/brands/${brand._id}`,
              {
                method: 'PUT',
                body: formData,
                isForm: true
              }
            );


            showToast(
              'Brand updated successfully',
              'success'
            );

          } else {

            await apiRequest(
              '/brands',
              {
                method: 'POST',
                body: formData,
                isForm: true
              }
            );


            showToast(
              'Brand created successfully',
              'success'
            );

          }


          await renderBrandsTab();


        } catch (err) {

          console.error(
            'Brand save error:',
            err
          );


          showToast(
            err.message ||
            'Unable to save brand',
            'error'
          );


          saveButton.disabled =
            false;

          saveButton.textContent =
            isEdit
              ? '✓ Update Brand'
              : '+ Create Brand';

        }

      }
    );

}