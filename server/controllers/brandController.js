// ==============================
// Brand Controller
// ==============================
const Brand = require('../models/Brand');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort('name');
  res.status(200).json({ success: true, count: brands.length, brands });
});

// @desc    Get single brand
// @route   GET /api/brands/:id
// @access  Public
exports.getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ApiError(404, 'Brand not found');
  res.status(200).json({ success: true, brand });
});

// @desc    Create brand
// @route   POST /api/brands
// @access  Private/Admin
exports.createBrand = asyncHandler(async (req, res) => {
  const logo = req.file ? `/uploads/products/${req.file.filename}` : '';
  const brand = await Brand.create({ ...req.body, logo });
  res.status(201).json({ success: true, message: 'Brand created', brand });
});

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Private/Admin
exports.updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ApiError(404, 'Brand not found');

  Object.assign(brand, req.body);
  if (req.file) brand.logo = `/uploads/products/${req.file.filename}`;

  await brand.save();
  res.status(200).json({ success: true, message: 'Brand updated', brand });
});

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Private/Admin
exports.deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ApiError(404, 'Brand not found');

  await brand.deleteOne();
  res.status(200).json({ success: true, message: 'Brand deleted' });
});
