// backend_service/models/user.model.js - User model
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
      minlength: 6,
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
        returnDate: Date,
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

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if ID is still valid
userSchema.methods.isIdValid = function () {
  return this.id_expiration > new Date() && this.status === "active";
};

module.exports = mongoose.model("User", userSchema);
