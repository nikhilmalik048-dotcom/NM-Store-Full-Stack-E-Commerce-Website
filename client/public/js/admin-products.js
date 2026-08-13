// ==============================
// admin-products.js - Admin Products Tab
// ==============================

let adminCategories = [];
let adminBrands = [];

async function renderProductsTab() {
  try {
    const [catData, brandData, prodData] = await Promise.all([
      apiRequest('/categories'),
      apiRequest('/brands'),
      apiRequest('/products?limit=100'),
    ]);
    adminCategories = catData.categories;
    adminBrands = brandData.brands;

    adminContent().innerHTML = `
      <div class="flex-between mb-3">
        <h2>Manage Products</h2>
        <button class="btn btn-primary" id="add-product-btn">+ Add Product</button>
      </div>
      <div id="product-form-wrap"></div>
      <div class="card" style="overflow-x:auto;">
        <table>
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Featured</th><th>Actions</th></tr></thead>
          <tbody id="admin-products-tbody"></tbody>
        </table>
      </div>
    `;

    renderProductsTable(prodData.products);
    document.getElementById('add-product-btn').addEventListener('click', () => showProductForm(null));
  } catch (err) {
    adminContent().innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('admin-products-tbody');
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No products yet. Add your first product above.</td></tr>';
    return;
  }
  tbody.innerHTML = products.map((p) => `
    <tr>
      <td><img src="${p.images && p.images[0] ? p.images[0] : 'https://placehold.co/50x50?text=No+Img'}" style="width:44px; height:44px; object-fit:cover; border-radius:6px;" /></td>
      <td>${p.name}</td>
      <td>${p.category ? p.category.name : '-'}</td>
      <td>${formatPrice(p.discountPrice > 0 ? p.discountPrice : p.price)}</td>
      <td>${p.stock}</td>
      <td>${p.isFeatured ? '✅' : '—'}</td>
      <td>
        <button class="btn btn-sm btn-outline edit-product-btn" data-id="${p._id}">Edit</button>
        <button class="btn btn-sm btn-danger delete-product-btn" data-id="${p._id}">Delete</button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.edit-product-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { product } = await apiRequest(`/products/${btn.dataset.id}`);
      showProductForm(product);
    });
  });

  tbody.querySelectorAll('.delete-product-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirmAction('Delete this product permanently?')) return;
      try {
        await apiRequest(`/products/${btn.dataset.id}`, { method: 'DELETE' });
        showToast('Product deleted', 'success');
        renderProductsTab();
      } catch (err) { showToast(err.message, 'error'); }
    });
  });
}

function showProductForm(product) {
  const isEdit = !!product;
  const wrap = document.getElementById('product-form-wrap');

  wrap.innerHTML = `
    <div class="card mb-3">
      <h3 class="mb-2">${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
      <form id="product-form">
        <div class="flex" style="gap:12px;">
          <div class="form-group" style="flex:1;"><label>Name</label><input type="text" id="p-name" required value="${isEdit ? escAttr(product.name) : ''}" /></div>
          <div class="form-group" style="flex:1;"><label>SKU</label><input type="text" value="${isEdit ? product.sku : 'Auto-generated'}" disabled /></div>
        </div>
        <div class="form-group"><label>Description</label><textarea id="p-description" rows="3" required>${isEdit ? product.description : ''}</textarea></div>
        <div class="flex" style="gap:12px;">
          <div class="form-group" style="flex:1;"><label>Price (₹)</label><input type="number" id="p-price" min="0" step="0.01" required value="${isEdit ? product.price : ''}" /></div>
          <div class="form-group" style="flex:1;"><label>Discount Price (₹, optional)</label><input type="number" id="p-discount" min="0" step="0.01" value="${isEdit && product.discountPrice ? product.discountPrice : ''}" /></div>
          <div class="form-group" style="flex:1;"><label>Stock</label><input type="number" id="p-stock" min="0" required value="${isEdit ? product.stock : ''}" /></div>
        </div>
        <div class="flex" style="gap:12px;">
          <div class="form-group" style="flex:1;">
            <label>Category</label>
            <select id="p-category" required>
              <option value="">Select category</option>
              ${adminCategories.map((c) => `<option value="${c._id}" ${isEdit && product.category && product.category._id === c._id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label>Brand</label>
            <select id="p-brand">
              <option value="">Select brand</option>
              ${adminBrands.map((b) => `<option value="${b._id}" ${isEdit && product.brand && product.brand._id === b._id ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label style="display:flex; align-items:center; gap:8px; font-weight:400;">
            <input type="checkbox" id="p-featured" style="width:auto;" ${isEdit && product.isFeatured ? 'checked' : ''} /> Mark as Featured
          </label>
        </div>
        <div class="form-group">
          <label>Product Images ${isEdit ? '(uploading adds more images)' : '(select one or more)'}</label>
          <input type="file" id="p-images" accept="image/*" multiple />
          ${isEdit && product.images && product.images.length > 0 ? `
            <div class="flex mt-1" style="gap:8px; flex-wrap:wrap;">
              ${product.images.map((img) => `
                <div style="position:relative;">
                  <img src="${img}" style="width:60px; height:60px; object-fit:cover; border-radius:6px;" />
                  <button type="button" class="remove-img-btn" data-img="${img}" style="position:absolute; top:-6px; right:-6px; background:var(--danger); color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:12px;">×</button>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="flex mt-2" style="gap:10px;">
          <button type="submit" class="btn btn-primary">${isEdit ? 'Update Product' : 'Create Product'}</button>
          <button type="button" class="btn btn-outline" id="cancel-product-form">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('cancel-product-form').addEventListener('click', () => (wrap.innerHTML = ''));

  wrap.querySelectorAll('.remove-img-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await apiRequest(`/products/${product._id}/images`, { method: 'DELETE', body: { imageUrl: btn.dataset.img } });
        showToast('Image removed', 'success');
        const { product: updated } = await apiRequest(`/products/${product._id}`);
        showProductForm(updated);
      } catch (err) { showToast(err.message, 'error'); }
    });
  });

  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('p-name').value.trim());
    formData.append('description', document.getElementById('p-description').value.trim());
    formData.append('price', document.getElementById('p-price').value);
    formData.append('discountPrice', document.getElementById('p-discount').value || 0);
    formData.append('stock', document.getElementById('p-stock').value);
    formData.append('category', document.getElementById('p-category').value);
    formData.append('brand', document.getElementById('p-brand').value);
    formData.append('isFeatured', document.getElementById('p-featured').checked);

    const files = document.getElementById('p-images').files;
    for (let i = 0; i < files.length; i++) formData.append('images', files[i]);

    try {
      if (isEdit) {
        await apiRequest(`/products/${product._id}`, { method: 'PUT', body: formData, isForm: true });
        showToast('Product updated', 'success');
      } else {
        await apiRequest('/products', { method: 'POST', body: formData, isForm: true });
        showToast('Product created', 'success');
      }
      renderProductsTab();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function escAttr(str) {
  return (str || '').toString().replace(/"/g, '&quot;');
}
