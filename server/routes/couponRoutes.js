// ==============================
// Coupon Routes
// ==============================
const express = require('express');
const router = express.Router();
const {
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
} = require('../controllers/couponController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/', getCoupons);
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

module.exports = router;
