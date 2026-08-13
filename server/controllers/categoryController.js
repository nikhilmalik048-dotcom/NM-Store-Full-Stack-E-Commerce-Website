// ==============================
// Category Controller
// ==============================
const Category = require('../models/Category');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  res.status(200).json({ success: true, count: categories.length, categories });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  res.status(200).json({ success: true, category });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
  const image = req.file ? `/uploads/products/${req.file.filename}` : '';
  const category = await Category.create({ ...req.body, image });
  res.status(201).json({ success: true, message: 'Category created', category });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  Object.assign(category, req.body);
  if (req.file) category.image = `/uploads/products/${req.file.filename}`;

  await category.save();
  res.status(200).json({ success: true, message: 'Category updated', category });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');

  await category.deleteOne();
  res.status(200).json({ success: true, message: 'Category deleted' });
});
