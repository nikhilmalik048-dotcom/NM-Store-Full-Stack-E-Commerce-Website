// ==============================
// User Routes
// ==============================
const express = require('express');
const router = express.Router();
const {
  updateProfile, uploadProfileImage, addAddress, updateAddress, deleteAddress, deleteAccount,
  getAllUsers, getUserById, updateUserByAdmin, deleteUserByAdmin,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Logged-in user's own profile management
router.put('/profile', protect, updateProfile);
router.put('/profile-image', protect, upload.single('profileImage'), uploadProfileImage);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);
router.delete('/account', protect, deleteAccount);

// Admin: manage all users
router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUserByAdmin);
router.delete('/:id', protect, authorize('admin'), deleteUserByAdmin);

module.exports = router;
