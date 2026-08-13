// ==============================
// Coupon Model
// ==============================
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: 0,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: 0, // 0 = no cap (only relevant for percentage type)
    },
    expiresAt: {
      type: Date,
      required: [true, 'Coupon expiry date is required'],
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Validate whether coupon is currently usable
couponSchema.methods.isValid = function () {
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  if (this.expiresAt < new Date()) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  return { valid: true };
};

module.exports = mongoose.model('Coupon', couponSchema);
