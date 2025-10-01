// backend_service/models/user.model.js - User model
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    matric_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    faculty: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    id_expiration: {
      type: Date,
      required: true,
    },
    profile_image: {
      type: String, // URL or path to stored image
      default: "",
    },
    qr_code: {
      type: String, // QR code data
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "blocked", "closed"],
      default: "active",
    },

    roles: [
      {
        type: String,
        enum: ["student", "librarian", "admin"],
        default: "student",
      },
    ],

    last_login: Date,
    password_change_at: Date,
    password_reset_token: String,
    password_reset_expires: Date,
    is_account_verified: { type: Boolean, default: false },
    account_verification_otp: { type: String },
    account_verification_otp_expires: { type: Date },

    borrowed_books: [
      {
        book_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
        },
        borrow_date: {
          type: Date,
          default: Date.now,
        },
        due_date: {
          type: Date,
          required: true,
        },
        return_date: Date,
        status: {
          type: String,
          enum: ["borrowed", "returned", "overdue"],
          default: "borrowed",
        },
      },
    ],
    fines: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Create the slug before saving the user - FIXED
userSchema.pre("save", async function (next) {
  if (this.isModified("full_name") || !this.slug) {
    let base_slug = this.full_name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

    // Check for duplicate slugs
    const existing_user = await this.constructor.findOne({ slug: base_slug });

    if (existing_user) {
      let counter = 1;
      while (
        await this.constructor.findOne({ slug: `${base_slug}-${counter}` })
      ) {
        counter++;
      }
      this.slug = `${base_slug}-${counter}`;
    } else {
      this.slug = base_slug;
    }
  }
  next();
});

// Verify Account
userSchema.methods.createAccountVerificationOtp = function () {
  const verification_code = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  this.account_verification_otp = verification_code;
  this.account_verification_otp_expires = Date.now() + 10 * 60 * 1000; // 10 mins
  return verification_code;
};

// Password Reset
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.password_reset_token = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 mins
  return resetToken;
};

// Match Password
userSchema.methods.isPasswordMatch = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if ID is still valid
userSchema.methods.isIdValid = function () {
  return this.id_expiration > new Date() && this.status === "active";
};

module.exports = mongoose.model("User", userSchema);
