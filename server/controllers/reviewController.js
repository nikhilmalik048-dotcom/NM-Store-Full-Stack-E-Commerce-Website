// ==============================
// Review Controller
// ==============================
const Review = require('../models/Review');
const Order = require('../models/Order');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name profileImage')
    .sort('-createdAt');

  res.status(200).json({ success: true, count: reviews.length, reviews });
});

// @desc    Create a review for a product
// @route   POST /api/reviews/product/:productId
// @access  Private
exports.createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) {
    throw new ApiError(400, 'You have already reviewed this product. You can edit your existing review.');
  }

  // Verify purchase (optional best practice - "verified purchase")
  const hasPurchased = await Order.exists({
    user: req.user._id,
    'items.product': productId,
    status: 'Delivered',
  });

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    comment,
    verifiedPurchase: !!hasPurchased,
  });

  res.status(201).json({ success: true, message: 'Review submitted', review });
});

// @desc    Update own review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Not authorized to edit this review');
  }

  if (req.body.rating) review.rating = req.body.rating;
  if (req.body.comment) review.comment = req.body.comment;
  await review.save();

  res.status(200).json({ success: true, message: 'Review updated', review });
});

// @desc    Delete own review (or admin can delete any)
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'Not authorized to delete this review');
  }

  await Review.findOneAndDelete({ _id: review._id });

  res.status(200).json({ success: true, message: 'Review deleted' });
});
