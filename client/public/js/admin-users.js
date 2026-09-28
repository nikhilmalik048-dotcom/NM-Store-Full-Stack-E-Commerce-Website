// ==============================
// admin-users.js - NM Store Admin Users
// ==============================

async function renderUsersTab() {
  try {
    const response = await apiRequest('/users?limit=100');
    const users = Array.isArray(response?.users) ? response.users : [];

    const currentUser = Auth.getUser();
    const currentUserId = String(currentUser?._id || currentUser?.id || '');

    const totalUsers = users.length;
    const adminUsers = users.filter((u) => u.role === 'admin').length;
    const customerUsers = users.filter((u) => u.role === 'customer').length;

    adminContent().innerHTML = `
      <section class="admin-page">

        <div class="admin-page-header">
          <div>
            <span class="admin-eyebrow">CUSTOMER MANAGEMENT</span>
            <h1>Users</h1>
            <p>Manage customer accounts, roles and access.</p>
          </div>
        </div>

        <div class="admin-stat-grid">

          <div class="admin-stat-card">
            <div class="admin-stat-icon">👥</div>
            <div>
              <span>Total Users</span>
              <strong>${totalUsers}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon">🛍️</div>
            <div>
              <span>Customers</span>
              <strong>${customerUsers}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon">🛡️</div>
            <div>
              <span>Administrators</span>
              <strong>${adminUsers}</strong>
            </div>
          </div>

          <div class="admin-stat-card">
            <div class="admin-stat-icon">📈</div>
            <div>
              <span>Accounts Loaded</span>
              <strong>${users.length}</strong>
            </div>
          </div>

        </div>

        <div class="card admin-table-card">

          <div class="admin-table-header">

            <div>
              <h3>All Users</h3>
              <p>View and manage registered NM Store accounts.</p>
            </div>

            <div class="admin-table-search">
              <input
                type="search"
                id="user-search"
                placeholder="Search name or email..."
                aria-label="Search users"
              />
            </div>

          </div>

          <div class="table-responsive">

            <table class="admin-table">

              <thead>
                <tr>
                  <th>User</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody id="admin-users-tbody"></tbody>

            </table>

          </div>

        </div>

      </section>
    `;

    const tbody = document.getElementById('admin-users-tbody');

    function renderUsersRows(list) {
      if (!list.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5">
              <div class="admin-empty-table">
                <div class="admin-empty-icon">👥</div>
                <h3>No users found</h3>
                <p>Try a different name or email address.</p>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = list.map((user) => {
        const userId = String(user._id || '');
        const isCurrentUser = userId === currentUserId;

        const name = escapeUserHTML(user.name || 'Unnamed User');
        const email = escapeUserHTML(user.email || '-');
        const phone = escapeUserHTML(user.phone || '-');

        const joinedDate = user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })
          : '-';

        const initial = String(user.name || 'U')
          .trim()
          .charAt(0)
          .toUpperCase();

        return `
          <tr>

            <td>
              <div class="user-table-profile">

                <div class="user-avatar">
                  ${escapeUserHTML(initial)}
                </div>

                <div class="user-table-info">
                  <strong>${name}</strong>
                  <span>${email}</span>

                  ${
                    isCurrentUser
                      ? '<small class="you-badge">You</small>'
                      : ''
                  }
                </div>

              </div>
            </td>

            <td>
              <span class="user-phone">
                ${phone}
              </span>
            </td>

            <td>

              <select
                class="role-select"
                data-id="${userId}"
                aria-label="Change role for ${name}"
                ${
                  isCurrentUser
                    ? 'disabled title="You cannot change your own role"'
                    : ''
                }
              >

                <option
                  value="customer"
                  ${user.role === 'customer' ? 'selected' : ''}
                >
                  Customer
                </option>

                <option
                  value="admin"
                  ${user.role === 'admin' ? 'selected' : ''}
                >
                  Admin
                </option>

              </select>

            </td>

            <td>
              <span class="joined-date">
                ${joinedDate}
              </span>
            </td>

            <td>

              <div class="admin-action-buttons">

                <button
                  class="btn btn-sm btn-danger delete-user-btn"
                  data-id="${userId}"
                  ${
                    isCurrentUser
                      ? 'disabled title="You cannot delete your own account"'
                      : ''
                  }
                >
                  Delete
                </button>

              </div>

            </td>

          </tr>
        `;
      }).join('');

      bindUserActions(list);
    }

    renderUsersRows(users);

    // ==============================
    // Search Users
    // ==============================

    const searchInput = document.getElementById('user-search');

    searchInput?.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();

      const filteredUsers = users.filter((user) => {
        const name = String(user.name || '').toLowerCase();
        const email = String(user.email || '').toLowerCase();
        const phone = String(user.phone || '').toLowerCase();

        return (
          name.includes(query) ||
          email.includes(query) ||
          phone.includes(query)
        );
      });

      renderUsersRows(filteredUsers);
    });

    // ==============================
    // Bind Actions
    // ==============================

    function bindUserActions(list) {

      // Role change
      tbody.querySelectorAll('.role-select').forEach((select) => {

        select.addEventListener('change', async () => {

          const userId = select.dataset.id;
          const newRole = select.value;

          const user = list.find(
            (item) => String(item._id) === String(userId)
          );

          const userName = user?.name || 'this user';

          try {

            select.disabled = true;

            await apiRequest(`/users/${userId}`, {
              method: 'PUT',
              body: {
                role: newRole
              }
            });

            showToast(
              `${userName}'s role updated to ${newRole}`,
              'success'
            );

            // Re-enable after successful update
            select.disabled = false;

          } catch (err) {

            showToast(
              err.message || 'Failed to update user role',
              'error'
            );

            renderUsersRows(users);
          }

        });

      });

      // Delete user
      tbody.querySelectorAll('.delete-user-btn').forEach((button) => {

        button.addEventListener('click', async () => {

          const userId = button.dataset.id;

          const user = list.find(
            (item) => String(item._id) === String(userId)
          );

          const userName = user?.name || 'this user';

          if (
            !confirmAction(
              `Delete "${userName}"? This action cannot be undone.`
            )
          ) {
            return;
          }

          try {

            button.disabled = true;
            button.textContent = 'Deleting...';

            await apiRequest(`/users/${userId}`, {
              method: 'DELETE'
            });

            showToast(
              `${userName} deleted successfully`,
              'success'
            );

            renderUsersTab();

          } catch (err) {

            button.disabled = false;
            button.textContent = 'Delete';

            showToast(
              err.message || 'Failed to delete user',
              'error'
            );

          }

        });

      });

    }

  } catch (err) {

    adminContent().innerHTML = `
      <section class="admin-page">

        <div class="admin-error">

          <div class="admin-error-icon">⚠️</div>

          <h2>Unable to load users</h2>

          <p>
            ${escapeUserHTML(
              err.message || 'Something went wrong while loading users.'
            )}
          </p>

          <button
            class="btn btn-primary"
            onclick="renderUsersTab()"
          >
            Try Again
          </button>

        </div>

      </section>
    `;

  }
}


// ==============================
// HTML Escape Helper
// ==============================

function escapeUserHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}