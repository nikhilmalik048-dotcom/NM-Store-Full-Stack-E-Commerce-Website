// ==============================
// Database Seed Script
// Run with: npm run seed
// Creates an admin account + sample categories/brands/products
// ==============================
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');

const run = async () => {
  await connectDB();

  console.log('Seeding database...');

  // ---- Admin user ----
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: process.env.ADMIN_NAME || 'Admin User',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin',
    });
    console.log(`Admin created -> email: ${adminEmail} / password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
  } else {
    console.log('Admin already exists, skipping.');
  }

  // ---- Categories ----
  const categoryNames = ['Electronics', 'Fashion', 'Home & Kitchen', 'Books', 'Sports'];
  const categories = {};
  for (const name of categoryNames) {
    let cat = await Category.findOne({ name });
    if (!cat) cat = await Category.create({ name, description: `${name} products` });
    categories[name] = cat;
  }

  // ---- Brands ----
  const brandNames = ['Generic', 'Nova', 'Zenith', 'Urban'];
  const brands = {};
  for (const name of brandNames) {
    let brand = await Brand.findOne({ name });
    if (!brand) brand = await Brand.create({ name });
    brands[name] = brand;
  }

  // ---- Sample products ----
const sampleProducts = [
    { name: 'Wireless Bluetooth Headphones', price: 2499, discountPrice: 1999, category: 'Electronics', brand: 'Nova', stock: 50, isFeatured: true, description: 'Over-ear wireless headphones with noise cancellation and 30-hour battery life.', images: ['/images/headphones.jpg'] },
    { name: 'Smart Fitness Watch', price: 3999, discountPrice: 0, category: 'Electronics', brand: 'Zenith', stock: 30, isFeatured: true, description: 'Track your steps, heart rate, and sleep with this everyday smart watch.', images: ['/images/fitness-watch.jpg'] },
    { name: "Men's Casual Shirt", price: 899, discountPrice: 699, category: 'Fashion', brand: 'Urban', stock: 100, isFeatured: false, description: 'Breathable cotton casual shirt, perfect for everyday wear.', images: ['/images/shirt.jpg'] },
    { name: 'Non-Stick Cookware Set', price: 1799, discountPrice: 0, category: 'Home & Kitchen', brand: 'Generic', stock: 40, isFeatured: true, description: '5-piece non-stick cookware set suitable for all stovetops.', images: ['/images/cookware-set.jpg'] },
    { name: 'The Pragmatic Programmer', price: 899, discountPrice: 649, category: 'Books', brand: 'Generic', stock: 60, isFeatured: false, description: 'A classic guide to becoming a better software developer.', images: ['/images/book.jpg'] },
    { name: 'Yoga Mat Pro', price: 1299, discountPrice: 999, category: 'Sports', brand: 'Zenith', stock: 80, isFeatured: true, description: 'Extra thick, non-slip yoga mat with carrying strap.', images: ['/images/yoga-mat.jpg'] },
  ];
for (const p of sampleProducts) {
    const exists = await Product.findOne({ name: p.name });
    if (!exists) {
      await Product.create({
        ...p,
        category: categories[p.category]._id,
        brand: brands[p.brand]._id,
      });
    }
}

  console.log('Seeding complete.');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
