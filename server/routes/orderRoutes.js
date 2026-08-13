// ==============================
// Order Routes
// ==============================
const express = require('express');
const router = express.Router();
const {
  placeOrder, getMyOrders, getOrderById, cancelOrder, getInvoice,
  getAllOrders, updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', placeOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.get('/:id/invoice', getInvoice);

// Admin only
router.get('/', authorize('admin'), getAllOrders);
router.put('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
