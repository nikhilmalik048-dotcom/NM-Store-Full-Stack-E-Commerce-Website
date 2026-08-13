// ==============================
// Cart Routes
// ==============================
const express = require('express');
const router = express.Router();
const {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect); // all cart routes require login

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/', clearCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.post('/coupon', applyCoupon);
router.delete('/coupon', removeCoupon);

module.exports = router;
