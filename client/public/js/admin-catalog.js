// ==============================
// admin-catalog.js - Admin Categories & Brands Tabs
// ==============================

// ------------------------------
// CATEGORIES
// ------------------------------
async function renderCategoriesTab() {
  try {
    const { categories } = await apiRequest('/categories');

    adminContent().innerHTML = `
      <div class="flex-between mb-3">
        <h2>Manage Categories</h2>
        <button class="btn btn-primary" id="add-category-btn">+ Add Category</button>
      </div>
      <div id="category-form-wrap"></div>
      <div class="card" style="overflow-x:auto;">
        <table>
          <thead><tr><th>Name</th><th>Slug</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody id="admin-categories-tbody"></tbody>
        </table>
      </div>
    `;

    const tbody = document.getElementById('admin-categories-tbody');
    tbody.innerHTML = categories.length === 0
      ? '<tr><td colspan="4">No categories yet.</td></tr>'
      : categories.map((c) => `
        <tr>
          <td>${c.name}</td>
          <td>${c.slug}</td>
          <td>${c.description || '-'}</td>
          <td>
            <button class="btn btn-sm btn-outline edit-cat-btn" data-id="${c._id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-cat-btn" data-id="${c._id}">Delete</button>
          </td>
        </tr>
      `).join('');

    tbody.querySelectorAll('.edit-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cat = categories.find((c) => c._id === btn.dataset.id);
        showCategoryForm(cat);
      });
    });
    tbody.querySelectorAll('.delete-cat-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirmAction('Delete this category? Products using it may be affected.')) return;
        try {
          await apiRequest(`/categories/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('Category deleted', 'success');
          renderCategoriesTab();
        } catch (err) { showToast(err.message, 'error'); }
      });
    });

    document.getElementById('add-category-btn').addEventListener('click', () => showCategoryForm(null));
  } catch (err) {
    adminContent().innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

function showCategoryForm(category) {
  const isEdit = !!category;
  const wrap = document.getElementById('category-form-wrap');
  wrap.innerHTML = `
    <div class="card mb-3">
      <h3 class="mb-2">${isEdit ? 'Edit Category' : 'Add Category'}</h3>
      <form id="category-form">
        <div class="form-group"><label>Name</label><input type="text" id="c-name" required value="${isEdit ? category.name : ''}" /></div>
        <div class="form-group"><label>Description</label><textarea id="c-description" rows="2">${isEdit ? category.description || '' : ''}</textarea></div>
        <div class="form-group"><label>Image (optional)</label><input type="file" id="c-image" accept="image/*" /></div>
        <div class="flex" style="gap:10px;">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
          <button type="button" class="btn btn-outline" id="cancel-cat-form">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById('cancel-cat-form').addEventListener('click', () => (wrap.innerHTML = ''));

  document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('c-name').value.trim());
    formData.append('description', document.getElementById('c-description').value.trim());
    const file = document.getElementById('c-image').files[0];
    if (file) formData.append('image', file);

    try {
      if (isEdit) {
        await apiRequest(`/categories/${category._id}`, { method: 'PUT', body: formData, isForm: true });
        showToast('Category updated', 'success');
      } else {
        await apiRequest('/categories', { method: 'POST', body: formData, isForm: true });
        showToast('Category created', 'success');
      }
      renderCategoriesTab();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

// ------------------------------
// BRANDS
// ------------------------------
async function renderBrandsTab() {
  try {
    const { brands } = await apiRequest('/brands');

    adminContent().innerHTML = `
      <div class="flex-between mb-3">
        <h2>Manage Brands</h2>
        <button class="btn btn-primary" id="add-brand-btn">+ Add Brand</button>
      </div>
      <div id="brand-form-wrap"></div>
      <div class="card" style="overflow-x:auto;">
        <table>
          <thead><tr><th>Name</th><th>Slug</th><th>Actions</th></tr></thead>
          <tbody id="admin-brands-tbody"></tbody>
        </table>
      </div>
    `;

    const tbody = document.getElementById('admin-brands-tbody');
    tbody.innerHTML = brands.length === 0
      ? '<tr><td colspan="3">No brands yet.</td></tr>'
      : brands.map((b) => `
        <tr>
          <td>${b.name}</td>
          <td>${b.slug}</td>
          <td>
            <button class="btn btn-sm btn-outline edit-brand-btn" data-id="${b._id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-brand-btn" data-id="${b._id}">Delete</button>
          </td>
        </tr>
      `).join('');

    tbody.querySelectorAll('.edit-brand-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const brand = brands.find((b) => b._id === btn.dataset.id);
        showBrandForm(brand);
      });
    });
    tbody.querySelectorAll('.delete-brand-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirmAction('Delete this brand?')) return;
        try {
          await apiRequest(`/brands/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('Brand deleted', 'success');
          renderBrandsTab();
        } catch (err) { showToast(err.message, 'error'); }
      });
    });

    document.getElementById('add-brand-btn').addEventListener('click', () => showBrandForm(null));
  } catch (err) {
    adminContent().innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

function showBrandForm(brand) {
  const isEdit = !!brand;
  const wrap = document.getElementById('brand-form-wrap');
  wrap.innerHTML = `
    <div class="card mb-3">
      <h3 class="mb-2">${isEdit ? 'Edit Brand' : 'Add Brand'}</h3>
      <form id="brand-form">
        <div class="form-group"><label>Name</label><input type="text" id="b-name" required value="${isEdit ? brand.name : ''}" /></div>
        <div class="form-group"><label>Logo (optional)</label><input type="file" id="b-logo" accept="image/*" /></div>
        <div class="flex" style="gap:10px;">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
          <button type="button" class="btn btn-outline" id="cancel-brand-form">Cancel</button>
        </div>
      </form>
    </div>
  `;
  document.getElementById('cancel-brand-form').addEventListener('click', () => (wrap.innerHTML = ''));

  document.getElementById('brand-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('b-name').value.trim());
    const file = document.getElementById('b-logo').files[0];
    if (file) formData.append('logo', file);

    try {
      if (isEdit) {
        await apiRequest(`/brands/${brand._id}`, { method: 'PUT', body: formData, isForm: true });
        showToast('Brand updated', 'success');
      } else {
        await apiRequest('/brands', { method: 'POST', body: formData, isForm: true });
        showToast('Brand created', 'success');
      }
      renderBrandsTab();
    } catch (err) { showToast(err.message, 'error'); }
  });
}
