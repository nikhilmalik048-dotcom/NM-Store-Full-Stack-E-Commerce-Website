// ==============================
// Review Routes
// ==============================
const express = require('express');
const router = express.Router();
const {
  getProductReviews, createReview, updateReview, deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validate, reviewRules } = require('../validators/validators');

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', protect, reviewRules, validate, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
