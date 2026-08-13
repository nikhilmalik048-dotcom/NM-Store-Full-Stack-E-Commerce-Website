// ==============================
// Express App Configuration
// ==============================
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const brandRoutes = require('./routes/brandRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ------------------------------
// Security Middleware
// ------------------------------
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Rate limiter - prevents brute force / DDoS on API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per window
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// ------------------------------
// Body Parsers
// ------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sanitize data against NoSQL query injection & XSS
app.use(mongoSanitize());
app.use(xss());

// ------------------------------
// Static Files
// ------------------------------
// Serve uploaded images (product images, profile pictures)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend (client) files
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));
app.use('/pages', express.static(path.join(__dirname, '..', 'client', 'pages')));
// Also serve page files directly at root (e.g. /order-success.html, /404.html)
app.use(express.static(path.join(__dirname, '..', 'client', 'pages')));

// ------------------------------
// API Routes
// ------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', time: new Date().toISOString() });
});

// ------------------------------
// Frontend Page Routes (serve HTML pages directly at friendly URLs)
// ------------------------------
const pagesDir = path.join(__dirname, '..', 'client', 'pages');

app.get('/', (req, res) => res.sendFile(path.join(pagesDir, 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(pagesDir, 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(pagesDir, 'register.html')));
app.get('/forgot-password', (req, res) => res.sendFile(path.join(pagesDir, 'forgot-password.html')));
app.get('/reset-password.html', (req, res) => res.sendFile(path.join(pagesDir, 'reset-password.html')));
app.get('/products', (req, res) => res.sendFile(path.join(pagesDir, 'products.html')));
app.get('/product-detail', (req, res) => res.sendFile(path.join(pagesDir, 'product-detail.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(pagesDir, 'cart.html')));
app.get('/wishlist', (req, res) => res.sendFile(path.join(pagesDir, 'wishlist.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(pagesDir, 'checkout.html')));
app.get('/orders', (req, res) => res.sendFile(path.join(pagesDir, 'orders.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(pagesDir, 'profile.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(pagesDir, 'admin-dashboard.html')));

// ------------------------------
// 404 Handler (for unmatched API routes)
// ------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Catch-all 404 for pages
app.use((req, res) => {
  res.status(404).sendFile(path.join(pagesDir, '404.html'));
});

// ------------------------------
// Global Error Handler (must be last)
// ------------------------------
app.use(errorHandler);

module.exports = app;
