// ==============================
// Product Controller
// ==============================
const Product = require('../models/Product');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// @desc    Get all products (search, filter, sort, paginate)
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const {
    search, category, brand, minPrice, maxPrice, minRating,
    sort, page = 1, limit = 12, featured,
  } = req.query;

  const filter = { isActive: true };

  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (brand) filter.brand = brand;
  if (featured) filter.isFeatured = featured === 'true';
  if (minRating) filter.ratingsAverage = { $gte: Number(minRating) };

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  let sortOption = '-createdAt';
  if (sort === 'price_asc') sortOption = 'price';
  if (sort === 'price_desc') sortOption = '-price';
  if (sort === 'rating') sortOption = '-ratingsAverage';
  if (sort === 'popular') sortOption = '-ratingsCount';
  if (sort === 'newest') sortOption = '-createdAt';

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(filter)
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  const total = await Product.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    products,
  });
});

// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isObjectId = id.match(/^[0-9a-fA-F]{24}$/);

  const query = isObjectId ? { _id: id } : { slug: id };
  const product = await Product.findOne(query)
    .populate('category', 'name slug')
    .populate('brand', 'name slug');

  if (!product) throw new ApiError(404, 'Product not found');

  res.status(200).json({ success: true, product });
});

// @desc    Get related products (same category, excluding current)
// @route   GET /api/products/:id/related
// @access  Public
exports.getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
    isActive: true,
  }).limit(8);

  res.status(200).json({ success: true, products: related });
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
  const images = req.files ? req.files.map((f) => `/uploads/products/${f.filename}`) : [];

  const product = await Product.create({ ...req.body, images });

  res.status(201).json({ success: true, message: 'Product created', product });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  Object.assign(product, req.body);

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((f) => `/uploads/products/${f.filename}`);
    product.images = [...product.images, ...newImages];
  }

  await product.save();

  res.status(200).json({ success: true, message: 'Product updated', product });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  await product.deleteOne();

  res.status(200).json({ success: true, message: 'Product deleted' });
});

// @desc    Remove a single image from a product
// @route   DELETE /api/products/:id/images
// @access  Private/Admin
exports.removeProductImage = asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  product.images = product.images.filter((img) => img !== imageUrl);
  await product.save();

  res.status(200).json({ success: true, message: 'Image removed', product });
});
