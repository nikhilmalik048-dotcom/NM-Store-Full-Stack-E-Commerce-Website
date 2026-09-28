// ==============================
// products.js - Premium All Products Page
// Search, Filter, Sort + Infinite Scroll
// ==============================

let currentPage = 1;
let isLoading = false;
let noMoreProducts = false;
let productsObserver = null;
let currentRequestId = 0;


// ==================================================
// QUERY PARAMETERS
// ==================================================

function getQueryParams() {
  return new URLSearchParams(
    window.location.search
  );
}


// ==================================================
// BUILD FILTERS
// ==================================================

function buildFilters() {

  const params = getQueryParams();

  const categoryEl =
    document.getElementById(
      'filter-category'
    );

  const brandEl =
    document.getElementById(
      'filter-brand'
    );

  const minPriceEl =
    document.getElementById(
      'filter-min-price'
    );

  const maxPriceEl =
    document.getElementById(
      'filter-max-price'
    );

  const ratingEl =
    document.getElementById(
      'filter-rating'
    );

  const sortEl =
    document.getElementById(
      'sort-select'
    );


  return {

    search:
      params.get('search') || '',

    category:
      categoryEl?.value ||
      params.get('category') ||
      '',

    brand:
      brandEl?.value || '',

    minPrice:
      minPriceEl?.value || '',

    maxPrice:
      maxPriceEl?.value || '',

    minRating:
      ratingEl?.value || '',

    sort:
      sortEl?.value ||
      params.get('sort') ||
      'newest',

    featured:
      params.get('featured') || ''

  };
}


// ==================================================
// LOAD FILTER OPTIONS
// ==================================================

async function loadFilterOptions() {

  const params =
    getQueryParams();


  // ------------------------------------------
  // Categories
  // ------------------------------------------

  try {

    const data =
      await apiRequest(
        '/categories'
      );

    const categories =
      data.categories || [];

    const catSelect =
      document.getElementById(
        'filter-category'
      );


    if (catSelect) {

      // Keep default option
      catSelect.innerHTML =
        '<option value="">All Categories</option>';


      categories.forEach(
        (category) => {

          const option =
            document.createElement(
              'option'
            );

          option.value =
            category._id;

          option.textContent =
            category.name;

          if (
            params.get(
              'category'
            ) === category._id
          ) {
            option.selected = true;
          }

          catSelect.appendChild(
            option
          );

        }
      );
    }

  } catch (err) {

    console.error(
      'Category loading error:',
      err
    );

  }


  // ------------------------------------------
  // Brands
  // ------------------------------------------

  try {

    const data =
      await apiRequest(
        '/brands'
      );

    const brands =
      data.brands || [];

    const brandSelect =
      document.getElementById(
        'filter-brand'
      );


    if (brandSelect) {

      brandSelect.innerHTML =
        '<option value="">All Brands</option>';


      brands.forEach(
        (brand) => {

          const option =
            document.createElement(
              'option'
            );

          option.value =
            brand._id;

          option.textContent =
            brand.name;

          brandSelect.appendChild(
            option
          );

        }
      );

    }

  } catch (err) {

    console.error(
      'Brand loading error:',
      err
    );

  }
}


// ==================================================
// UPDATE URL
// ==================================================

function updateProductURL() {

  const filters =
    buildFilters();

  const params =
    new URLSearchParams();


  if (filters.search) {
    params.set(
      'search',
      filters.search
    );
  }

  if (filters.category) {
    params.set(
      'category',
      filters.category
    );
  }

  if (filters.brand) {
    params.set(
      'brand',
      filters.brand
    );
  }

  if (filters.minPrice) {
    params.set(
      'minPrice',
      filters.minPrice
    );
  }

  if (filters.maxPrice) {
    params.set(
      'maxPrice',
      filters.maxPrice
    );
  }

  if (filters.minRating) {
    params.set(
      'minRating',
      filters.minRating
    );
  }

  if (
    filters.sort &&
    filters.sort !== 'newest'
  ) {
    params.set(
      'sort',
      filters.sort
    );
  }

  if (filters.featured) {
    params.set(
      'featured',
      filters.featured
    );
  }


  const query =
    params.toString();

  window.history.replaceState(
    {},
    '',
    query
      ? `/products?${query}`
      : '/products'
  );
}


// ==================================================
// PRODUCT SKELETON
// ==================================================

function productSkeletonHTML(
  count = 8
) {

  return Array.from(
    { length: count },
    () => `
      <div class="product-card home-loading-card">
        <div class="product-skeleton-image"></div>

        <div class="product-skeleton-content">

          <div class="skeleton-line short"></div>

          <div class="skeleton-line"></div>

          <div class="skeleton-line medium"></div>

          <div class="skeleton-button"></div>

        </div>
      </div>
    `
  ).join('');
}


// ==================================================
// LOAD PRODUCTS
// ==================================================

async function loadProducts(
  page = 1,
  append = false
) {

  if (
    isLoading ||
    (noMoreProducts && append)
  ) {
    return;
  }


  const container =
    document.getElementById(
      'products-container'
    );

  if (!container) {
    return;
  }


  isLoading = true;

  const requestId =
    ++currentRequestId;


  const filters =
    buildFilters();


  const params =
    new URLSearchParams();


  Object.entries(
    filters
  ).forEach(
    ([key, value]) => {

      if (
        value !== null &&
        value !== undefined &&
        value !== ''
      ) {
        params.set(
          key,
          value
        );
      }

    }
  );


  params.set(
    'page',
    page
  );

  // Load 24 products at a time
  params.set(
    'limit',
    24
  );


  // ------------------------------------------
  // First page
  // ------------------------------------------

  if (!append) {

    currentPage = 1;

    noMoreProducts = false;

    showScrollMessage('');

    container.innerHTML =
      productSkeletonHTML(8);

  } else {

    showScrollMessage(
      'Loading more products...'
    );

  }


  // ------------------------------------------
  // Results title
  // ------------------------------------------

  const resultsTitle =
    document.getElementById(
      'results-title'
    );


  if (resultsTitle) {

    if (filters.search) {

      resultsTitle.textContent =
        `Search results for "${filters.search}"`;

    } else if (
      filters.featured === 'true'
    ) {

      resultsTitle.textContent =
        'Featured Products';

    } else {

      resultsTitle.textContent =
        'All Products';

    }

  }


  try {

    const data =
      await apiRequest(
        `/products?${params.toString()}`
      );


    // Ignore outdated request
    if (
      requestId !==
      currentRequestId
    ) {
      return;
    }


    const products =
      data.products || [];


    // ------------------------------------------
    // No products
    // ------------------------------------------

    if (
      products.length === 0
    ) {

      if (!append) {

        container.innerHTML = `
          <div
            class="empty-state products-empty-state"
            style="grid-column:1/-1;"
          >

            <div class="empty-icon">
              🔍
            </div>

            <h3>
              No products found
            </h3>

            <p>
              Try adjusting your filters
              or search for something else.
            </p>

            <button
              type="button"
              class="btn btn-primary"
              id="empty-clear-filters"
            >
              Clear Filters
            </button>

          </div>
        `;


        const clearButton =
          document.getElementById(
            'empty-clear-filters'
          );


        if (clearButton) {

          clearButton.addEventListener(
            'click',
            clearAllFilters
          );

        }

      }


      noMoreProducts = true;

      showScrollMessage(
        'No more products'
      );

      return;
    }


    // ------------------------------------------
    // Render products
    // ------------------------------------------

    const html =
      products
        .map(
          productCardHTML
        )
        .join('');


    if (append) {

      container.insertAdjacentHTML(
        'beforeend',
        html
      );

    } else {

      container.innerHTML =
        html;

    }


    // Attach only once
    attachProductCardEvents(
      container
    );


    currentPage =
      Number(
        data.page || page
      );


    // ------------------------------------------
    // Last page
    // ------------------------------------------

    if (
      !data.pages ||
      currentPage >=
        Number(data.pages)
    ) {

      noMoreProducts =
        true;

      showScrollMessage(
        `All ${Number(
          data.total || products.length
        ).toLocaleString()} products loaded`
      );

    } else {

      noMoreProducts =
        false;

      showScrollMessage('');

    }


  } catch (err) {

    console.error(
      'Product loading error:',
      err
    );


    if (!append) {

      container.innerHTML = `
        <div
          class="empty-state products-empty-state"
          style="grid-column:1/-1;"
        >

          <div class="empty-icon">
            ⚠️
          </div>

          <h3>
            Could not load products
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
            id="retry-products"
          >
            Try Again
          </button>

        </div>
      `;


      const retry =
        document.getElementById(
          'retry-products'
        );


      if (retry) {

        retry.addEventListener(
          'click',
          () => {
            loadProducts(
              1,
              false
            );
          }
        );

      }

    } else {

      showScrollMessage(
        'Unable to load more products. Scroll again to retry.'
      );

    }

  } finally {

    isLoading = false;

  }
}


// ==================================================
// SCROLL STATUS
// ==================================================

function showScrollMessage(
  message
) {

  let status =
    document.getElementById(
      'scroll-status'
    );


  if (!status) {

    status =
      document.createElement(
        'div'
      );

    status.id =
      'scroll-status';

    status.className =
      'scroll-status';


    const container =
      document.getElementById(
        'products-container'
      );


    if (
      container &&
      container.parentElement
    ) {

      container.parentElement.appendChild(
        status
      );

    }

  }


  if (!status) {
    return;
  }


  status.textContent =
    message;


  status.classList.toggle(
    'visible',
    Boolean(message)
  );
}


// ==================================================
// INFINITE SCROLL
// ==================================================

function setupInfiniteScroll() {

  const container =
    document.getElementById(
      'products-container'
    );

  if (!container) {
    return;
  }


  let sentinel =
    document.getElementById(
      'scroll-sentinel'
    );


  // Create sentinel if missing
  if (!sentinel) {

    sentinel =
      document.createElement(
        'div'
      );

    sentinel.id =
      'scroll-sentinel';

    sentinel.style.height =
      '1px';


    if (
      container.parentElement
    ) {

      container.parentElement.appendChild(
        sentinel
      );

    }

  }


  // Disconnect old observer
  if (productsObserver) {

    productsObserver.disconnect();

  }


  productsObserver =
    new IntersectionObserver(

      (entries) => {

        const entry =
          entries[0];


        if (
          entry &&
          entry.isIntersecting &&
          !isLoading &&
          !noMoreProducts
        ) {

          loadProducts(
            currentPage + 1,
            true
          );

        }

      },

      {
        root: null,

        rootMargin:
          '600px',

        threshold: 0

      }

    );


  productsObserver.observe(
    sentinel
  );
}


// ==================================================
// CLEAR FILTERS
// ==================================================

function clearAllFilters() {

  const fields = [

    'filter-category',

    'filter-brand',

    'filter-min-price',

    'filter-max-price',

    'filter-rating'

  ];


  fields.forEach(
    (id) => {

      const element =
        document.getElementById(
          id
        );

      if (element) {
        element.value = '';
      }

    }
  );


  const sort =
    document.getElementById(
      'sort-select'
    );


  if (sort) {
    sort.value =
      'newest';
  }


  // Remove query parameters
  window.history.replaceState(
    {},
    '',
    '/products'
  );


  // Reset loading state
  currentPage = 1;

  noMoreProducts =
    false;


  loadProducts(
    1,
    false
  );


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


// ==================================================
// APPLY FILTERS
// ==================================================

function applyFilters() {

  updateProductURL();


  currentPage = 1;

  noMoreProducts =
    false;


  loadProducts(
    1,
    false
  );


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


// ==================================================
// SORT PRODUCTS
// ==================================================

function handleSortChange() {

  updateProductURL();


  currentPage = 1;

  noMoreProducts =
    false;


  loadProducts(
    1,
    false
  );


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


// ==================================================
// PAGINATION
// ==================================================

function renderPagination() {

  const element =
    document.getElementById(
      'pagination'
    );


  if (element) {
    element.innerHTML =
      '';
  }

}


// ==================================================
// PAGE INITIALIZATION
// ==================================================

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    try {

      // ----------------------------------------
      // Load filters
      // ----------------------------------------

      await loadFilterOptions();


      const params =
        getQueryParams();


      // ----------------------------------------
      // Restore sort
      // ----------------------------------------

      const sort =
        document.getElementById(
          'sort-select'
        );


      if (
        sort &&
        params.get('sort')
      ) {

        sort.value =
          params.get('sort');

      }


      // ----------------------------------------
      // Restore search
      // ----------------------------------------

      const searchInput =
        document.querySelector(
          '#search-input'
        );


      if (
        searchInput &&
        params.get('search')
      ) {

        searchInput.value =
          params.get('search');

      }


      // ----------------------------------------
      // Initial products
      // ----------------------------------------

      await loadProducts(
        1,
        false
      );


      // ----------------------------------------
      // Infinite scroll
      // ----------------------------------------

      setupInfiniteScroll();


      // ----------------------------------------
      // Apply filters
      // ----------------------------------------

      const applyButton =
        document.getElementById(
          'apply-filters'
        );


      if (applyButton) {

        applyButton.addEventListener(
          'click',
          applyFilters
        );

      }


      // ----------------------------------------
      // Clear filters
      // ----------------------------------------

      const clearButton =
        document.getElementById(
          'clear-filters'
        );


      if (clearButton) {

        clearButton.addEventListener(
          'click',
          clearAllFilters
        );

      }


      // ----------------------------------------
      // Sort
      // ----------------------------------------

      if (sort) {

        sort.addEventListener(
          'change',
          handleSortChange
        );

      }


    } catch (err) {

      console.error(
        'Products page initialization error:',
        err
      );

    }

  }
);