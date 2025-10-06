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
    publication_year: {
      type: Number,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    total_copies: {
      type: Number,
      required: true,
      min: 1,
    },
    available_copies: {
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
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;
