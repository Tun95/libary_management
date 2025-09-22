// backend_service/models/user.model.js - User model
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    matricNumber: {
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
    fullName: {
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
    idExpiration: {
      type: Date,
      required: true,
    },
    profileImage: {
      type: String, // URL or path to stored image
      default: "",
    },
    qrCode: {
      type: String, // QR code data
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    borrowedBooks: [
      {
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Book",
        },
        borrowDate: {
          type: Date,
          default: Date.now,
        },
        dueDate: {
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
  return this.idExpiration > new Date() && this.isActive;
};

module.exports = mongoose.model("User", userSchema);
