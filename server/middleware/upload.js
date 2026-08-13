// ==============================
// Multer Configuration - Image Upload Handling
// ==============================
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { ApiError } = require('./errorHandler');

// Ensure uploads sub-folders exist
const productDir = path.join(__dirname, '..', 'uploads', 'products');
const profileDir = path.join(__dirname, '..', 'uploads', 'profiles');
[productDir, profileDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Storage engine - decides destination folder based on route usage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.baseUrl.includes('users')) {
      cb(null, profileDir);
    } else {
      cb(null, productDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeValid = allowedTypes.test(file.mimetype);

  if (extValid && mimeValid) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files (jpeg, jpg, png, webp, gif) are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
