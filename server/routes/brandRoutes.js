// ==============================
// Brand Routes
// ==============================
const express = require('express');
const router = express.Router();
const {
  getBrands, getBrandById, createBrand, updateBrand, deleteBrand,
} = require('../controllers/brandController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getBrands);
router.get('/:id', getBrandById);

router.post('/', protect, authorize('admin'), upload.single('logo'), createBrand);
router.put('/:id', protect, authorize('admin'), upload.single('logo'), updateBrand);
router.delete('/:id', protect, authorize('admin'), deleteBrand);

module.exports = router;
