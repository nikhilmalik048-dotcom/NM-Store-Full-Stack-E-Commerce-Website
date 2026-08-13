# NM Store — Full-Stack E-Commerce Website

A complete, production-ready e-commerce web application built with **Node.js, Express, MongoDB, and vanilla JavaScript** (MVC architecture). No frameworks required on the frontend — just open it in a browser after starting the server.

---

## ✨ Features

- **Authentication**: Register, login, logout, JWT auth, forgot/reset password, change password, role-based access (admin/customer)
- **Products**: Browse, search, filter (category, brand, price, rating), sort, pagination, image gallery, related products
- **Reviews & Ratings**: Star ratings, comments, auto-calculated product average rating
- **Cart**: Add/remove/update quantity, coupon codes, tax & shipping calculation, persistent per-user cart
- **Wishlist**: Add/remove, move to cart
- **Checkout & Orders**: Multiple addresses, Cash on Delivery (COD) — built to be extended with Stripe/Razorpay, order tracking, cancel order, printable invoice
- **Admin Panel**: Dashboard with sales chart & stats, manage products (with image upload), categories, brands, orders (status updates), coupons, and users
- **Security**: Helmet, CORS, rate limiting, bcrypt password hashing, Mongo sanitization, XSS protection, JWT
- **Responsive Design**: Works on desktop, tablet, and mobile

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| File Upload | Multer (local `/uploads` folder) |
| Payments | Cash on Delivery (expandable to Stripe/Razorpay) |

---

## 📁 Folder Structure

```
ecommerce-store/
├── client/
│   ├── public/
│   │   ├── css/style.css
│   │   ├── js/            (main.js, product-card.js, cart.js, admin.js, ...)
│   │   └── images/
│   └── pages/              (index.html, login.html, products.html, admin-dashboard.html, ...)
├── server/
│   ├── config/db.js
│   ├── controllers/        (auth, product, order, cart, admin, ...)
│   ├── middleware/         (auth, upload, errorHandler)
│   ├── models/              (User, Product, Order, Cart, Wishlist, Review, Coupon, Category, Brand)
│   ├── routes/
│   ├── uploads/             (product & profile images land here)
│   ├── utils/                (generateToken.js, seed.js)
│   ├── validators/
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ✅ Requirements

- **Node.js** v18 or higher — [download here](https://nodejs.org/)
- **MongoDB** — either:
  - Installed locally ([MongoDB Community Server](https://www.mongodb.com/try/download/community)), or
  - A free cloud cluster via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)

---

## 🚀 Getting Started in VS Code

### 1. Open the project
Unzip the project folder and open it in VS Code (`File → Open Folder...`).

### 2. Install dependencies
Open a terminal in VS Code (`` Ctrl+` ``) and run:

```bash
npm install
```

### 3. Configure environment variables
Copy the example env file:

```bash
# Windows (PowerShell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open the new `.env` file and update these values:

```env
PORT=5000
NODE_ENV=development

# If using local MongoDB:
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_store

# If using MongoDB Atlas, replace with your connection string, e.g.:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/ecommerce_store

JWT_SECRET=change_this_to_a_long_random_secret_key
JWT_EXPIRE=7d

CLIENT_URL=http://localhost:5000

ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
```

> ⚠️ **Important**: Change `JWT_SECRET` to a long, random string before deploying anywhere public.

### 4. Start MongoDB (if running locally)

```bash
# macOS (via Homebrew)
brew services start mongodb-community

# Windows
# MongoDB usually runs as a Windows service automatically after install.
# If not, run "mongod" from the MongoDB bin folder.

# Linux
sudo systemctl start mongod
```

If you're using MongoDB Atlas instead, skip this step — just make sure your `.env` connection string is correct and your IP address is whitelisted in Atlas's Network Access settings.

### 5. Seed the database (creates admin account + sample products)

```bash
npm run seed
```

This creates:
- An **admin account** using the email/password from your `.env` file
- Sample categories, brands, and 6 sample products

### 6. Run the project

```bash
# Development mode (auto-restarts on file changes)
npm run dev

# OR production mode
npm start
```

### 7. Open in browser

Visit **http://localhost:5000**

- Shop as a customer: register a new account, or
- Log in as admin: use the email/password from your `.env` (defaults to `admin@example.com` / `Admin@123`) and visit **http://localhost:5000/admin**

---

## 🔑 Environment Variables Reference

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key used to sign JWT tokens — **change this** |
| `JWT_EXPIRE` | Token expiry duration (e.g. `7d`) |
| `CLIENT_URL` | Used for CORS configuration |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by `npm run seed` to create the admin account |

---

## 📡 API Overview

All endpoints are prefixed with `/api`.

| Resource | Base Route |
|---|---|
| Auth | `/api/auth` (register, login, logout, me, forgot/reset password, change-password) |
| Users | `/api/users` (profile, addresses, admin user management) |
| Products | `/api/products` (CRUD, search/filter/sort, related products) |
| Categories | `/api/categories` |
| Brands | `/api/brands` |
| Cart | `/api/cart` (add/update/remove, coupon apply/remove) |
| Wishlist | `/api/wishlist` |
| Orders | `/api/orders` (place, my-orders, cancel, admin status updates) |
| Reviews | `/api/reviews` |
| Coupons | `/api/coupons` (admin only) |
| Admin | `/api/admin/dashboard` (stats) |

Protected routes require an `Authorization: Bearer <token>` header (the frontend handles this automatically once logged in).

---

## 🖼 Screenshots

_Add your own screenshots here after running the project locally:_

- `screenshots/home.png`
- `screenshots/products.png`
- `screenshots/cart.png`
- `screenshots/admin-dashboard.png`

---

## 🧩 Extending Payments

The order/payment flow is intentionally structured so Stripe or Razorpay can be dropped in later:

1. Add your provider's SDK as a dependency.
2. Extend `paymentMethod` enum in `server/models/Order.js`.
3. Add a payment intent/order-creation step in `server/controllers/orderController.js` before order creation.
4. Add a webhook route to confirm payment and update `paymentStatus`.

---

## 🩹 Troubleshooting

- **"MongoDB connection error"** → Make sure MongoDB is running locally, or that your Atlas connection string/IP whitelist is correct.
- **"Cannot find module..."** → Run `npm install` again.
- **Images not uploading** → Ensure `server/uploads/products` and `server/uploads/profiles` folders exist (they're created automatically on first run).
- **Port already in use** → Change `PORT` in `.env` to something else, e.g. `5001`.

---

## 📄 License

MIT — free to use and modify for personal or commercial projects.
