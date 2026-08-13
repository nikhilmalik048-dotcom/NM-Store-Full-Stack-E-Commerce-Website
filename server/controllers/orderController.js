// ==============================
// Order Controller
// ==============================
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const { computeTotals } = require('./cartController');

// @desc    Place a new order (checkout) from the current cart
// @route   POST /api/orders
// @access  Private
exports.placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, billingAddress, paymentMethod } = req.body;

  if (!shippingAddress) throw new ApiError(400, 'Shipping address is required');

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Your cart is empty');

  // Verify stock availability for every item before placing order
  for (const item of cart.items) {
    if (!item.product || !item.product.isActive) {
      throw new ApiError(400, `Product no longer available: ${item.product ? item.product.name : 'unknown'}`);
    }
    if (item.product.stock < item.quantity) {
      throw new ApiError(400, `Insufficient stock for "${item.product.name}". Available: ${item.product.stock}`);
    }
  }

  const totals = computeTotals(cart);

  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.images && item.product.images[0] ? item.product.images[0] : '',
    price: item.price,
    quantity: item.quantity,
  }));

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    paymentMethod: paymentMethod || 'COD',
    paymentStatus: 'pending',
    itemsPrice: totals.itemsPrice,
    taxPrice: totals.taxPrice,
    shippingPrice: totals.shippingPrice,
    discountAmount: totals.discount,
    couponCode: cart.couponCode,
    totalPrice: totals.totalPrice,
  });

  // Deduct stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
  }

  // Increment coupon usage
  if (cart.couponCode) {
    await Coupon.findOneAndUpdate({ code: cart.couponCode }, { $inc: { usedCount: 1 } });
  }

  // Clear cart
  cart.items = [];
  cart.couponCode = null;
  cart.couponDiscount = 0;
  await cart.save();

  res.status(201).json({ success: true, message: 'Order placed successfully', order });
});

// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.status(200).json({ success: true, count: orders.length, orders });
});

// @desc    Get single order details
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  // Only the order's owner or an admin can view it
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view this order');
  }

  res.status(200).json({ success: true, order });
});

// @desc    Cancel an order (only if not yet shipped)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to cancel this order');
  }

  if (['Shipped', 'Delivered', 'Cancelled'].includes(order.status)) {
    throw new ApiError(400, `Order cannot be cancelled once it is ${order.status}`);
  }

  order.status = 'Cancelled';
  order.cancelReason = req.body.reason || 'Cancelled by user';
  order.statusHistory.push({ status: 'Cancelled' });
  await order.save();

  // Restock items
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }

  res.status(200).json({ success: true, message: 'Order cancelled', order });
});

// @desc    Generate a simple text invoice for an order
// @route   GET /api/orders/:id/invoice
// @access  Private
exports.getInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to view this invoice');
  }

  res.status(200).json({ success: true, order });
});

// ------------------------------
// ADMIN: order management
// ------------------------------

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    orders,
  });
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Pending', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

  if (!validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid order status');
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  order.status = status;
  order.statusHistory.push({ status });

  if (status === 'Delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = order.paymentMethod === 'COD' ? 'paid' : order.paymentStatus;
  }

  await order.save();

  res.status(200).json({ success: true, message: 'Order status updated', order });
});
