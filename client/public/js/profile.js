// ==============================
// profile.js - Profile page logic
// (edit profile, upload photo, addresses, change password, delete account)
// ==============================

let currentUserData = null;

async function loadProfile() {
  const root = document.getElementById('profile-root');
  if (!requireLogin()) return;

  try {
    const { user } = await apiRequest('/auth/me');
    currentUserData = user;

    root.innerHTML = `
      <div class="card mb-3">
        <h3 class="mb-2">Profile Photo</h3>
        <div class="flex" style="align-items:center; gap:16px;">
          <img id="profile-img-preview" src="${user.profileImage || 'https://placehold.co/90x90?text=Photo'}"
               style="width:90px; height:90px; border-radius:50%; object-fit:cover; border:2px solid var(--border);" />
          <div>
            <input type="file" id="profile-img-input" accept="image/*" />
            <button class="btn btn-sm btn-primary mt-1" id="upload-photo-btn">Upload Photo</button>
          </div>
        </div>
      </div>

      <div class="card mb-3">
        <h3 class="mb-2">Personal Information</h3>
        <form id="profile-form">
          <div class="form-group"><label>Full Name</label><input type="text" id="edit-name" value="${escAttr(user.name)}" required /></div>
          <div class="form-group"><label>Email (cannot be changed)</label><input type="email" value="${escAttr(user.email)}" disabled /></div>
          <div class="form-group"><label>Phone</label><input type="tel" id="edit-phone" value="${escAttr(user.phone || '')}" /></div>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
      </div>

      <div class="card mb-3">
        <h3 class="mb-2">Saved Addresses</h3>
        <div id="address-list"></div>
        <button class="btn btn-outline btn-sm mt-2" id="add-address-toggle">+ Add Address</button>
        <form id="new-address-form" style="display:none;" class="mt-2">
          <div class="form-group"><label>Full Name</label><input type="text" id="na-name" required /></div>
          <div class="form-group"><label>Phone</label><input type="tel" id="na-phone" required /></div>
          <div class="form-group"><label>Street</label><input type="text" id="na-street" required /></div>
          <div class="flex" style="gap:10px;">
            <div class="form-group" style="flex:1;"><label>City</label><input type="text" id="na-city" required /></div>
            <div class="form-group" style="flex:1;"><label>State</label><input type="text" id="na-state" required /></div>
          </div>
          <div class="flex" style="gap:10px;">
            <div class="form-group" style="flex:1;"><label>Zip Code</label><input type="text" id="na-zip" required /></div>
            <div class="form-group" style="flex:1;"><label>Country</label><input type="text" id="na-country" value="India" required /></div>
          </div>
          <button type="submit" class="btn btn-primary btn-sm">Save Address</button>
        </form>
      </div>

      <div class="card mb-3">
        <h3 class="mb-2">Change Password</h3>
        <form id="password-form">
          <div class="form-group"><label>Current Password</label><input type="password" id="current-password" required /></div>
          <div class="form-group"><label>New Password</label><input type="password" id="new-password" required minlength="6" /></div>
          <button type="submit" class="btn btn-primary">Update Password</button>
        </form>
      </div>

      <div class="card" style="border:1.5px solid var(--danger);">
        <h3 class="mb-2" style="color:var(--danger);">Danger Zone</h3>
        <p style="font-size:13.5px; color:var(--text-light); margin-bottom:12px;">
          Deleting your account is permanent and cannot be undone.
        </p>
        <button class="btn btn-danger" id="delete-account-btn">Delete My Account</button>
      </div>
    `;

    renderAddressList(user.addresses || []);
    attachProfileEvents();
  } catch (err) {
    root.innerHTML = `<div class="empty-state">Error: ${err.message}</div>`;
  }
}

function escAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

function renderAddressList(addresses) {
  const container = document.getElementById('address-list');
  if (addresses.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light); font-size:13.5px;">No saved addresses yet.</p>';
    return;
  }
  container.innerHTML = addresses.map((a) => `
    <div class="card mb-1" style="padding:12px; font-size:13.5px;">
      <div class="flex-between">
        <div><strong>${a.fullName}</strong> - ${a.phone}<br/>${a.street}, ${a.city}, ${a.state} ${a.zipCode}, ${a.country}</div>
        <button class="btn btn-sm btn-outline delete-addr-btn" data-id="${a._id}">Delete</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.delete-addr-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirmAction('Delete this address?')) return;
      try {
        const data = await apiRequest(`/users/addresses/${btn.dataset.id}`, { method: 'DELETE' });
        renderAddressList(data.addresses);
        showToast('Address deleted', 'success');
      } catch (err) { showToast(err.message, 'error'); }
    });
  });
}

function attachProfileEvents() {
  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest('/users/profile', {
        method: 'PUT',
        body: {
          name: document.getElementById('edit-name').value.trim(),
          phone: document.getElementById('edit-phone').value.trim(),
        },
      });
      const user = Auth.getUser();
      user.name = data.user.name;
      user.phone = data.user.phone;
      localStorage.setItem('user', JSON.stringify(user));
      showToast('Profile updated', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('upload-photo-btn').addEventListener('click', async () => {
    const fileInput = document.getElementById('profile-img-input');
    if (!fileInput.files[0]) return showToast('Please choose a file first', 'error');

    const formData = new FormData();
    formData.append('profileImage', fileInput.files[0]);

    try {
      const data = await apiRequest('/users/profile-image', { method: 'PUT', body: formData, isForm: true });
      document.getElementById('profile-img-preview').src = data.user.profileImage;
      showToast('Profile photo updated', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('add-address-toggle').addEventListener('click', () => {
    const form = document.getElementById('new-address-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('new-address-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const address = {
      fullName: document.getElementById('na-name').value.trim(),
      phone: document.getElementById('na-phone').value.trim(),
      street: document.getElementById('na-street').value.trim(),
      city: document.getElementById('na-city').value.trim(),
      state: document.getElementById('na-state').value.trim(),
      zipCode: document.getElementById('na-zip').value.trim(),
      country: document.getElementById('na-country').value.trim(),
    };
    try {
      const data = await apiRequest('/users/addresses', { method: 'POST', body: address });
      renderAddressList(data.addresses);
      showToast('Address added', 'success');
      e.target.reset();
      document.getElementById('new-address-form').style.display = 'none';
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: {
          currentPassword: document.getElementById('current-password').value,
          newPassword: document.getElementById('new-password').value,
        },
      });
      showToast('Password updated successfully', 'success');
      e.target.reset();
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('delete-account-btn').addEventListener('click', async () => {
    if (!confirmAction('Are you absolutely sure? This will permanently delete your account.')) return;
    try {
      await apiRequest('/users/account', { method: 'DELETE' });
      Auth.clearSession();
      showToast('Account deleted', 'success');
      setTimeout(() => (window.location.href = '/'), 800);
    } catch (err) { showToast(err.message, 'error'); }
  });
}

document.addEventListener('DOMContentLoaded', loadProfile);
