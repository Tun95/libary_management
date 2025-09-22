// backend_service/models/book.model.js - Book model
const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    publicationYear: {
      type: Number,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
    },
    location: {
      shelf: String,
      row: String,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // URL or path to book cover image
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Book", bookSchema);
