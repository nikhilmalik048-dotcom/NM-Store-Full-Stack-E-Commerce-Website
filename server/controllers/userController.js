// ==============================
// User Controller (profile, addresses, admin user management)
// ==============================
const User = require('../models/User');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// @desc    Update logged-in user's profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (phone) user.phone = phone;

  await user.save();
  res.status(200).json({ success: true, message: 'Profile updated successfully', user });
});

// @desc    Upload / update profile image
// @route   PUT /api/users/profile-image
// @access  Private
exports.uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload an image file');
  }

  const user = await User.findById(req.user._id);
  user.profileImage = `/uploads/profiles/${req.file.filename}`;
  await user.save();

  res.status(200).json({ success: true, message: 'Profile image updated', user });
});

// @desc    Add a new address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({ success: true, message: 'Address added', addresses: user.addresses });
});

// @desc    Update an address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);

  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  Object.assign(address, req.body);
  await user.save();

  res.status(200).json({ success: true, message: 'Address updated', addresses: user.addresses });
});

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((addr) => addr._id.toString() !== req.params.addressId);
  await user.save();

  res.status(200).json({ success: true, message: 'Address removed', addresses: user.addresses });
});

// @desc    Delete (soft-delete) own account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.isDeleted = true;
  await user.save();

  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Account deleted successfully' });
});

// ------------------------------
// ADMIN: manage users
// ------------------------------

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { isDeleted: false };
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).skip(skip).limit(limit).sort('-createdAt');
  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    users,
  });
});

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.status(200).json({ success: true, user });
});

// @desc    Update user role / details
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUserByAdmin = asyncHandler(async (req, res) => {
  const { name, role, phone } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (role) user.role = role;

  await user.save();
  res.status(200).json({ success: true, message: 'User updated', user });
});

// @desc    Delete a user (soft delete)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.isDeleted = true;
  await user.save();

  res.status(200).json({ success: true, message: 'User deleted' });
});
