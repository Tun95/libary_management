// backend_service/src/services/book.service.js
const logger = require("../../config/logger");
const Book = require("../../models/book.model");
const User = require("../../models/user.model");
const Transaction = require("../../models/transaction.model");
const { ERROR_MESSAGES } = require("../constants/constants");

class BookService {
  // Get all books with filtering and pagination
  async getBooks({ page = 1, limit = 10, search, category, available }) {
    try {
      let query = { is_active: true };

      // Search by title or author
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
        ];
      }

      // Filter by category
      if (category) {
        query.category = { $regex: category, $options: "i" };
      }

      // Filter by availability
      if (available === "true") {
        query.available_copies = { $gt: 0 };
      }

      const books = await Book.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ title: 1 });

      const total = await Book.countDocuments(query);

      await logger.info("Books retrieved successfully", {
        service: "BookService",
        method: "getBooks",
        count: books.length,
        total,
        page,
        limit,
      });

      return {
        books,
        pagination: {
          total_pages: Math.ceil(total / limit),
          current_page: parseInt(page),
          total,
          limit: parseInt(limit),
        },
      };
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "getBooks",
      });
      throw error;
    }
  }

  // Get book by ID
  async getBookById(bookId) {
    try {
      const book = await Book.findById(bookId);

      if (!book) {
        throw new Error(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      await logger.info("Book retrieved by ID", {
        service: "BookService",
        method: "getBookById",
        book_id: bookId,
      });

      return book;
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "getBookById",
        book_id: bookId,
      });
      throw error;
    }
  }

  // Add new book
  async addBook(bookData) {
    try {
      const book = new Book({
        ...bookData,
        available_copies: bookData.total_copies,
      });

      await book.save();

      await logger.info("Book added successfully", {
        service: "BookService",
        method: "addBook",
        book_id: book._id,
        title: book.title,
        isbn: book.isbn,
      });

      return book;
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "addBook",
      });
      throw error;
    }
  }

  // Update book
  async updateBook(bookId, updateData) {
    try {
      const book = await Book.findByIdAndUpdate(bookId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!book) {
        throw new Error(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      await logger.info("Book updated successfully", {
        service: "BookService",
        method: "updateBook",
        book_id: bookId,
      });

      return book;
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "updateBook",
        book_id: bookId,
      });
      throw error;
    }
  }

  // Delete book (soft delete)
  async deleteBook(bookId) {
    try {
      const book = await Book.findByIdAndUpdate(
        bookId,
        { is_active: false },
        { new: true }
      );

      if (!book) {
        throw new Error(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      await logger.info("Book deleted successfully", {
        service: "BookService",
        method: "deleteBook",
        book_id: bookId,
      });

      return book;
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "deleteBook",
        book_id: bookId,
      });
      throw error;
    }
  }

  // Borrow book
  async borrowBook(bookId, userId, dueDate) {
    try {
      // Check if book exists and is available
      const book = await Book.findById(bookId);
      if (!book || !book.is_active) {
        throw new Error(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      if (book.available_copies < 1) {
        throw new Error(ERROR_MESSAGES.NO_COPIES_AVAILABLE);
      }

      // Check if user exists and ID is valid
      const user = await User.findById(userId);
      if (!user || user.status !== "active") {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      if (!user.isIdValid()) {
        throw new Error(ERROR_MESSAGES.ID_EXPIRED_BORROW);
      }

      // Check if user has any fines
      if (user.fines > 0) {
        throw new Error(ERROR_MESSAGES.OUTSTANDING_FINES);
      }

      // Check if user already has this book borrowed
      const alreadyBorrowed = user.borrowed_books.some(
        (borrowed) =>
          borrowed.book_id.toString() === bookId &&
          borrowed.status === "borrowed"
      );

      if (alreadyBorrowed) {
        throw new Error(ERROR_MESSAGES.ALREADY_BORROWED);
      }

      // Create transaction
      const transaction = new Transaction({
        user: userId,
        book: bookId,
        due_date: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 2 weeks
      });

      // Update book available copies
      book.available_copies -= 1;

      // Add to user's borrowed books
      user.borrowed_books.push({
        book_id: bookId,
        borrow_date: new Date(),
        due_date: transaction.due_date,
        status: "borrowed",
      });

      await Promise.all([transaction.save(), book.save(), user.save()]);

      await logger.info("Book borrowed successfully", {
        service: "BookService",
        method: "borrowBook",
        book_id: bookId,
        user_id: userId,
        transaction_id: transaction._id,
      });

      return transaction;
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "borrowBook",
        book_id: bookId,
        user_id: userId,
      });
      throw error;
    }
  }

  // Return book
  async returnBook(transactionId) {
    try {
      const transaction = await Transaction.findById(transactionId)
        .populate("user")
        .populate("book");

      if (!transaction) {
        throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
      }

      if (transaction.status === "returned") {
        throw new Error(ERROR_MESSAGES.ALREADY_RETURNED);
      }

      // Calculate fine if overdue
      let fine_amount = 0;
      if (new Date() > transaction.due_date) {
        const daysOverdue = Math.ceil(
          (new Date() - transaction.due_date) / (1000 * 60 * 60 * 24)
        );
        fine_amount = daysOverdue * 5; // $5 per day fine
      }

      // Update transaction
      transaction.return_date = new Date();
      transaction.status = fine_amount > 0 ? "overdue" : "returned";
      transaction.fine_amount = fine_amount;

      // Update book available copies
      const book = await Book.findById(transaction.book._id);
      book.available_copies += 1;

      // Update user's borrowed books and fines
      const user = await User.findById(transaction.user._id);
      const borrowedBook = user.borrowed_books.find(
        (b) =>
          b.book_id.toString() === transaction.book._id.toString() &&
          b.status === "borrowed"
      );

      if (borrowedBook) {
        borrowedBook.return_date = new Date();
        borrowedBook.status = fine_amount > 0 ? "overdue" : "returned";
      }

      user.fines += fine_amount;

      await Promise.all([transaction.save(), book.save(), user.save()]);

      await logger.info("Book returned successfully", {
        service: "BookService",
        method: "returnBook",
        transaction_id: transactionId,
        fine_amount,
        user_id: user._id,
        book_id: book._id,
      });

      return {
        transaction,
        fine_amount,
      };
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "returnBook",
        transaction_id: transactionId,
      });
      throw error;
    }
  }
}

module.exports = new BookService();
