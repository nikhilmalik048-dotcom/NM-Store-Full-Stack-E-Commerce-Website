// ==============================
// Authentication & Authorization Middleware
// ==============================
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, ApiError } = require('./errorHandler');

// Protect routes - verifies JWT token and attaches user to req
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Token can come from Authorization header (Bearer) or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    throw new ApiError(401, 'User no longer exists');
  }

  if (user.isDeleted) {
    throw new ApiError(401, 'This account has been deleted');
  }

  req.user = user;
  next();
});

// Restrict route to specific roles, e.g. authorize('admin')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, `Role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource`);
  }
  next();
};

module.exports = { protect, authorize };
