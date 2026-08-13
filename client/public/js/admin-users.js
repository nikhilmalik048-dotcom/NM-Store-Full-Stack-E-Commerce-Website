// ==============================
// admin-users.js - Admin Users Tab
// ==============================

async function renderUsersTab() {
  try {
    const { users } = await apiRequest('/users?limit=100');

    adminContent().innerHTML = `
      <h2 class="mb-3">Manage Users</h2>
      <div class="card" style="overflow-x:auto;">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody id="admin-users-tbody"></tbody>
        </table>
      </div>
    `;

    const tbody = document.getElementById('admin-users-tbody');
    tbody.innerHTML = users.length === 0
      ? '<tr><td colspan="6">No users found.</td></tr>'
      : users.map((u) => `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.phone || '-'}</td>
          <td>
            <select class="role-select" data-id="${u._id}" ${u._id === Auth.getUser()._id ? 'disabled title="You cannot change your own role"' : ''}>
              <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </td>
          <td style="font-size:12px;">${new Date(u.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-danger delete-user-btn" data-id="${u._id}" ${u._id === Auth.getUser()._id ? 'disabled' : ''}>Delete</button>
          </td>
        </tr>
      `).join('');

    tbody.querySelectorAll('.role-select').forEach((select) => {
      select.addEventListener('change', async () => {
        try {
          await apiRequest(`/users/${select.dataset.id}`, { method: 'PUT', body: { role: select.value } });
          showToast('User role updated', 'success');
        } catch (err) {
          showToast(err.message, 'error');
          renderUsersTab();
        }
      });
    });

    tbody.querySelectorAll('.delete-user-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirmAction('Delete this user account?')) return;
        try {
          await apiRequest(`/users/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('User deleted', 'success');
          renderUsersTab();
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
  } catch (err) {
    adminContent().innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}
