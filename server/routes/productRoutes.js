// ==============================
// Product Routes
// ==============================
const express = require('express');
const router = express.Router();
const {
  getProducts, getProductById, getRelatedProducts,
  createProduct, updateProduct, deleteProduct, removeProductImage,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validate, productRules } = require('../validators/validators');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);

router.post('/', protect, authorize('admin'), upload.array('images', 6), productRules, validate, createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 6), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.delete('/:id/images', protect, authorize('admin'), removeProductImage);

module.exports = router;
