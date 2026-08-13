// ==============================
// Cart Controller
// ==============================
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const TAX_RATE = 0.05; // 5% tax
const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 50;

// Helper: compute cart totals
const computeTotals = (cart) => {
  const itemsPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = cart.couponDiscount || 0;
  const taxable = Math.max(itemsPrice - discount, 0);
  const taxPrice = Math.round(taxable * TAX_RATE * 100) / 100;
  const shippingPrice = taxable >= FREE_SHIPPING_THRESHOLD || taxable === 0 ? 0 : SHIPPING_FEE;
  const totalPrice = Math.round((taxable + taxPrice + shippingPrice) * 100) / 100;

  return { itemsPrice, discount, taxPrice, shippingPrice, totalPrice };
};

// @desc    Get logged-in user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price discountPrice stock');
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.status(200).json({ success: true, cart, totals: computeTotals(cart) });
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found');
  if (product.stock < quantity) throw new ApiError(400, 'Not enough stock available');

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price;

  if (existingItem) {
    existingItem.quantity += Number(quantity);
    existingItem.price = finalPrice;
  } else {
    cart.items.push({ product: productId, quantity, price: finalPrice });
  }

  await cart.save();
  await cart.populate('items.product', 'name images price discountPrice stock');

  res.status(200).json({ success: true, message: 'Item added to cart', cart, totals: computeTotals(cart) });
});

// @desc    Update item quantity in cart
// @route   PUT /api/cart/:productId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (quantity < 1) throw new ApiError(400, 'Quantity must be at least 1');

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) throw new ApiError(404, 'Item not found in cart');

  const product = await Product.findById(req.params.productId);
  if (product && product.stock < quantity) throw new ApiError(400, 'Not enough stock available');

  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product', 'name images price discountPrice stock');

  res.status(200).json({ success: true, message: 'Cart updated', cart, totals: computeTotals(cart) });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  await cart.populate('items.product', 'name images price discountPrice stock');

  res.status(200).json({ success: true, message: 'Item removed from cart', cart, totals: computeTotals(cart) });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  cart.items = [];
  cart.couponCode = null;
  cart.couponDiscount = 0;
  await cart.save();

  res.status(200).json({ success: true, message: 'Cart cleared', cart, totals: computeTotals(cart) });
});

// @desc    Apply a coupon code to the cart
// @route   POST /api/cart/coupon
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const coupon = await Coupon.findOne({ code: code?.toUpperCase() });
  if (!coupon) throw new ApiError(404, 'Invalid coupon code');

  const validity = coupon.isValid();
  if (!validity.valid) throw new ApiError(400, validity.message);

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price discountPrice stock');
  if (!cart || cart.items.length === 0) throw new ApiError(400, 'Cart is empty');

  const itemsPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (itemsPrice < coupon.minPurchase) {
    throw new ApiError(400, `Minimum purchase of ₹${coupon.minPurchase} required for this coupon`);
  }

  let discount = coupon.discountType === 'percentage'
    ? (itemsPrice * coupon.discountValue) / 100
    : coupon.discountValue;

  if (coupon.discountType === 'percentage' && coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  cart.couponCode = coupon.code;
  cart.couponDiscount = Math.round(discount * 100) / 100;
  await cart.save();

  res.status(200).json({ success: true, message: 'Coupon applied', cart, totals: computeTotals(cart) });
});

// @desc    Remove applied coupon
// @route   DELETE /api/cart/coupon
// @access  Private
exports.removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found');

  cart.couponCode = null;
  cart.couponDiscount = 0;
  await cart.save();

  res.status(200).json({ success: true, message: 'Coupon removed', cart, totals: computeTotals(cart) });
});

exports.computeTotals = computeTotals;
