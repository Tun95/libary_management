// backend_service/src/services/book.service.js
const logger = require("../../config/logger");
const Book = require("../../models/book.model");
const User = require("../../models/user.model");
const Transaction = require("../../models/transaction.model");
const { ERROR_MESSAGES } = require("../constants/constants");
const { default: mongoose } = require("mongoose");
const FineUtils = require("../utils/fineUtils");
const Fine = require("../../models/fine.model");

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

  // Get all books for admin with advanced filtering (including inactive books)
  async getAdminBooks({
    page = 1,
    limit = 10,
    search,
    category,
    available,
    is_active,
  }) {
    try {
      let query = {};

      // Filter by active status (if provided)
      if (is_active !== undefined) {
        query.is_active = is_active === "true";
      }

      // Search by title, author, or ISBN
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
          { isbn: { $regex: search, $options: "i" } },
        ];
      }

      // Filter by category
      if (category) {
        query.category = { $regex: category, $options: "i" };
      }

      // Filter by availability
      if (available === "true") {
        query.available_copies = { $gt: 0 };
      } else if (available === "false") {
        query.available_copies = 0;
      }

      const books = await Book.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ is_active: -1, title: 1 }); // Sort by active first, then title

      const total = await Book.countDocuments(query);

      await logger.info("Admin books retrieved successfully", {
        service: "BookService",
        method: "getAdminBooks",
        count: books.length,
        total,
        page,
        limit,
        filters: { search, category, available, is_active },
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
        method: "getAdminBooks",
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
      // Handle total_copies update - recalculate available_copies
      if (updateData.total_copies !== undefined) {
        const currentBook = await Book.findById(bookId);
        if (!currentBook) {
          throw new Error(ERROR_MESSAGES.BOOK_NOT_FOUND);
        }

        const borrowedCount =
          currentBook.total_copies - currentBook.available_copies;
        if (updateData.total_copies < borrowedCount) {
          throw new Error(
            `Cannot reduce total copies below ${borrowedCount} (currently borrowed copies)`
          );
        }
        updateData.available_copies = updateData.total_copies - borrowedCount;
      }

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

      await logger.info("Book soft deleted successfully", {
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

  // Permanent delete book
  async permanentDeleteBook(bookId) {
    try {
      // Check if book exists
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error(ERROR_MESSAGES.BOOK_NOT_FOUND);
      }

      // Check for active borrows and get user details
      const usersWithActiveBorrows = await User.find({
        "borrowed_books.book_id": bookId,
        "borrowed_books.return_date": null,
        "borrowed_books.status": { $in: ["borrowed", "overdue"] },
      }).select("full_name identification_code email borrowed_books");

      const activeTransactions = await Transaction.find({
        book: bookId,
        return_date: null,
        status: { $in: ["borrowed", "overdue"] },
      }).populate("user", "full_name identification_code email");

      const allActiveBorrows = [];

      // Process users with active borrows from User model
      if (usersWithActiveBorrows.length > 0) {
        usersWithActiveBorrows.forEach((user) => {
          const userBorrows = user.borrowed_books.filter(
            (borrow) =>
              borrow.book_id.toString() === bookId.toString() &&
              !borrow.return_date &&
              ["borrowed", "overdue"].includes(borrow.status)
          );

          userBorrows.forEach((borrow) => {
            allActiveBorrows.push({
              user_id: user._id,
              full_name: user.full_name,
              identification_code: user.identification_code,
              email: user.email,
              borrow_date: borrow.borrow_date,
              due_date: borrow.due_date,
              status: borrow.status,
              days_overdue:
                borrow.status === "overdue"
                  ? Math.floor(
                      (new Date() - new Date(borrow.due_date)) /
                        (1000 * 60 * 60 * 24)
                    )
                  : 0,
              source: "user_borrowed_books",
            });
          });
        });
      }

      // Process active transactions from Transaction model
      if (activeTransactions.length > 0) {
        activeTransactions.forEach((transaction) => {
          allActiveBorrows.push({
            user_id: transaction.user._id,
            full_name: transaction.user.full_name,
            identification_code: transaction.user.identification_code,
            email: transaction.user.email,
            borrow_date: transaction.borrow_date,
            due_date: transaction.due_date,
            status: transaction.status,
            transaction_id: transaction._id,
            days_overdue:
              transaction.status === "overdue"
                ? Math.floor(
                    (new Date() - new Date(transaction.due_date)) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0,
            source: "transaction_model",
          });
        });
      }

      // If there are active borrows, throw error with details
      if (allActiveBorrows.length > 0) {
        const error = new Error(ERROR_MESSAGES.BOOK_HAS_ACTIVE_BORROWS);
        error.activeBorrows = allActiveBorrows;
        error.borrowCount = allActiveBorrows.length;
        error.bookTitle = book.title;
        error.bookAuthor = book.author;
        throw error;
      }

      // ... rest of the deletion logic remains the same
      // [Previous deletion code here]
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "permanentDeleteBook",
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

      // Check if user has outstanding fines
      if (user.fines > 0) {
        throw new Error(ERROR_MESSAGES.OUTSTANDING_FINES);
      }

      // Check if user has reached maximum borrow limit
      const currentBorrowedCount = user.borrowed_books.filter(
        (book) => book.status === "borrowed"
      ).length;

      // ==================================
      const MAX_BORROW_LIMIT = 5; // Configurable
      if (currentBorrowedCount >= MAX_BORROW_LIMIT) {
        throw new Error(ERROR_MESSAGES.BORROW_LIMIT_REACHED);
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

      // Calculate due date (default 2 weeks)
      const calculatedDueDate =
        dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      // Validate due date is reasonable
      const maxDueDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months max
      if (calculatedDueDate > maxDueDate) {
        throw new Error("Due date cannot be more than 3 months from now");
      }

      // Create transaction
      const transaction = new Transaction({
        user: userId,
        book: bookId,
        due_date: calculatedDueDate,
      });

      // Update book available copies using atomic operation
      const updatedBook = await Book.findByIdAndUpdate(
        bookId,
        { $inc: { available_copies: -1 } },
        { new: true }
      );

      if (!updatedBook) {
        throw new Error("Failed to update book availability");
      }

      // Add to user's borrowed books
      user.borrowed_books.push({
        book_id: bookId,
        borrow_date: new Date(),
        due_date: calculatedDueDate,
        status: "borrowed",
      });

      await Promise.all([transaction.save(), user.save()]);

      await logger.info("Book borrowed successfully", {
        service: "BookService",
        method: "borrowBook",
        book_id: bookId,
        user_id: userId,
        transaction_id: transaction._id,
        due_date: calculatedDueDate,
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

  // Return book with proper fine calculation
  async returnBook(
    transactionId,
    condition = "good",
    notes = "",
    waiveFine = false
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findById(transactionId)
        .populate("user")
        .populate("book")
        .session(session);

      if (!transaction) {
        throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
      }

      if (transaction.status === "returned") {
        throw new Error(ERROR_MESSAGES.ALREADY_RETURNED);
      }

      const returnDate = new Date();
      const isOverdue = returnDate > transaction.due_date;

      // Calculate fine only if book is overdue and not waived
      let fine_amount = 0;
      let fine_waived = false;

      if (isOverdue && !waiveFine) {
        fine_amount = this.calculateFine(transaction.due_date, returnDate);
      } else if (isOverdue && waiveFine) {
        fine_waived = true;
        fine_amount = this.calculateFine(transaction.due_date, returnDate);
      }

      // Check for damage fines
      const damageFine = this.calculateDamageFine(condition);
      fine_amount += damageFine;

      // Update transaction
      transaction.return_date = returnDate;
      transaction.status = isOverdue ? "overdue" : "returned";
      transaction.fine_amount = fine_amount;
      transaction.condition_on_return = condition;
      transaction.return_notes = notes;
      transaction.fine_waived = fine_waived;

      // Update book available copies
      const book = await Book.findByIdAndUpdate(
        transaction.book._id,
        { $inc: { available_copies: 1 } },
        { new: true, session }
      );

      if (!book) {
        throw new Error("Book not found during return process");
      }

      // Update user's borrowed books
      const user = await User.findById(transaction.user._id).session(session);
      const borrowedBookIndex = user.borrowed_books.findIndex(
        (b) =>
          b.book_id.toString() === transaction.book._id.toString() &&
          b.status === "borrowed"
      );

      if (borrowedBookIndex !== -1) {
        user.borrowed_books[borrowedBookIndex].return_date = returnDate;
        user.borrowed_books[borrowedBookIndex].status = isOverdue
          ? "overdue"
          : "returned";
      }

      // Create fine record if applicable
      if (fine_amount > 0) {
        const fine = new Fine({
          user: user._id,
          transaction: transaction._id,
          amount: fine_amount,
          reason: fine_waived
            ? `Overdue return (waived) - Condition: ${condition}`
            : `Overdue return - Condition: ${condition}`,
          status: fine_waived ? "waived" : "outstanding",
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to pay
          waived_by: fine_waived ? req.user?._id : null,
          waived_reason: fine_waived ? "Admin waiver" : null,
        });
        await fine.save({ session });

        // Only add to user fines if not waived
        if (!fine_waived) {
          user.fines += fine_amount;
        }
      }

      await Promise.all([transaction.save(), user.save()]);
      await session.commitTransaction();

      // Generate appropriate message
      let message = "Book returned successfully";
      if (fine_amount > 0 && fine_waived) {
        message = `Book returned. Fine of $${fine_amount} waived.`;
      } else if (fine_amount > 0) {
        message = `Book returned overdue. Fine: $${fine_amount}`;
      } else if (damageFine > 0) {
        message = `Book returned with damage. Fine: $${damageFine}`;
      }

      await emailService.sendReturnConfirmationEmail(
        transaction.user,
        returnDetails
      );

      await logger.info("Book returned successfully", {
        service: "BookService",
        method: "returnBook",
        transaction_id: transactionId,
        is_overdue: isOverdue,
        fine_amount,
        fine_waived,
        condition,
        user_id: user._id,
        book_id: book._id,
      });

      return {
        transaction,
        fine_amount,
        fine_waived,
        is_overdue: isOverdue,
        damage_fine: damageFine,
        condition,
        message,
      };
    } catch (error) {
      await session.abortTransaction();
      await logger.error(error, {
        service: "BookService",
        method: "returnBook",
        transaction_id: transactionId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Bulk return books
  async bulkReturnBooks(transactionIds) {
    const results = {
      processed: 0,
      successful: [],
      failed: [],
      total_fines: 0,
    };

    for (const transactionId of transactionIds) {
      try {
        const result = await this.returnBook(transactionId);
        results.successful.push({
          transaction_id: transactionId,
          result,
        });
        results.processed++;
        results.total_fines += result.fine_amount || 0;
      } catch (error) {
        results.failed.push({
          transaction_id: transactionId,
          error: error.message,
        });
      }
    }

    return results;
  }

  // Get user fines with detailed breakdown
  async getUserFines(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      const outstandingFines = await Fine.find({
        user: userId,
        status: { $in: ["outstanding", "overdue"] },
      }).populate("transaction");

      const paidFines = await Fine.find({
        user: userId,
        status: "paid",
      }).populate("transaction");

      const waivedFines = await Fine.find({
        user: userId,
        status: "waived",
      }).populate("transaction");

      const totalOutstanding = outstandingFines.reduce(
        (sum, fine) => sum + fine.amount,
        0
      );
      const totalPaid = paidFines.reduce((sum, fine) => sum + fine.amount, 0);
      const totalWaived = waivedFines.reduce(
        (sum, fine) => sum + fine.amount,
        0
      );

      return {
        user: {
          _id: user._id,
          full_name: user.full_name,
          identification_code: user.identification_code,
          current_fines: user.fines,
        },
        fines: {
          outstanding: outstandingFines,
          paid: paidFines,
          waived: waivedFines,
        },
        summary: {
          total_outstanding: totalOutstanding,
          total_paid: totalPaid,
          total_waived: totalWaived,
          count_outstanding: outstandingFines.length,
          count_paid: paidFines.length,
          count_waived: waivedFines.length,
        },
      };
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "getUserFines",
        user_id: userId,
      });
      throw error;
    }
  }

  // Pay fine with transaction tracking
  async payFine(
    userId,
    amount,
    paymentMethod,
    transactionIds = [],
    notes = ""
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      if (user.fines === 0) {
        throw new Error(ERROR_MESSAGES.NO_OUTSTANDING_FINES);
      }

      if (amount > user.fines) {
        throw new Error(ERROR_MESSAGES.OVERPAYMENT_NOT_ALLOWED);
      }

      if (amount <= 0) {
        throw new Error(ERROR_MESSAGES.INVALID_PAYMENT_AMOUNT);
      }

      // Update specific fines if transaction IDs provided
      let paidFines = [];
      if (transactionIds.length > 0) {
        const fines = await Fine.find({
          _id: { $in: transactionIds },
          user: userId,
          status: { $in: ["outstanding", "overdue"] },
        }).session(session);

        const totalFineAmount = fines.reduce(
          (sum, fine) => sum + fine.amount,
          0
        );

        if (amount < totalFineAmount) {
          throw new Error(ERROR_MESSAGES.INSUFFICIENT_PAYMENT);
        }

        // Mark fines as paid
        for (const fine of fines) {
          fine.status = "paid";
          fine.paid_date = new Date();
          fine.payment_method = paymentMethod;
          fine.payment_notes = notes;
          await fine.save({ session });
          paidFines.push(fine);
        }
      }

      // Update user's fine balance
      user.fines -= amount;
      if (user.fines < 0) user.fines = 0;

      // Create payment record
      const paymentRecord = new FinePayment({
        user: userId,
        amount,
        payment_method: paymentMethod,
        transaction_ids: transactionIds,
        notes,
        paid_fines: paidFines.map((fine) => fine._id),
      });
      await paymentRecord.save({ session });

      await Promise.all([user.save()]);
      await session.commitTransaction();

      await logger.info("Fine payment processed successfully", {
        service: "BookService",
        method: "payFine",
        user_id: userId,
        amount,
        payment_method: paymentMethod,
        remaining_fines: user.fines,
      });

      return {
        user: {
          _id: user._id,
          full_name: user.full_name,
          fines_remaining: user.fines,
        },
        payment: {
          amount,
          payment_method: paymentMethod,
          paid_fines: paidFines,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      await logger.error(error, {
        service: "BookService",
        method: "payFine",
        user_id: userId,
      });
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Waive fine (admin only)
  async waiveFine(userId, amount, transactionIds = [], reason = "", adminId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate waiver eligibility
      await FineUtils.validateWaiverEligibility(userId, amount, transactionIds);

      const user = await User.findById(userId).session(session);
      let waivedFines = [];
      let totalWaived = 0;

      if (transactionIds.length > 0) {
        // Waive specific fines
        const fines = await Fine.find({
          _id: { $in: transactionIds },
          user: userId,
          status: { $in: ["outstanding", "overdue"] },
        }).session(session);

        for (const fine of fines) {
          fine.status = "waived";
          fine.waived_by = adminId;
          fine.waived_reason = reason;
          fine.waived_at = new Date();
          await fine.save({ session });
          waivedFines.push(fine);
          totalWaived += fine.amount;
        }
      } else {
        // Waive general amount
        totalWaived = Math.min(amount || user.fines, user.fines);

        // Find fines to waive (oldest first)
        const finesToWaive = await Fine.find({
          user: userId,
          status: { $in: ["outstanding", "overdue"] },
        })
          .sort({ due_date: 1 })
          .session(session);

        let remainingWaiver = totalWaived;
        for (const fine of finesToWaive) {
          if (remainingWaiver <= 0) break;

          const waiveAmount = Math.min(fine.amount, remainingWaiver);
          if (waiveAmount === fine.amount) {
            // Waive entire fine
            fine.status = "waived";
            fine.waived_by = adminId;
            fine.waived_reason = reason;
            fine.waived_at = new Date();
            await fine.save({ session });
            waivedFines.push(fine);
          } else {
            // Partial waiver - create new fine record for remaining amount
            const newFine = new Fine({
              user: userId,
              transaction: fine.transaction,
              amount: fine.amount - waiveAmount,
              reason: fine.reason,
              status: "outstanding",
              due_date: fine.due_date,
            });
            await newFine.save({ session });

            // Update original fine
            fine.amount = waiveAmount;
            fine.status = "waived";
            fine.waived_by = adminId;
            fine.waived_reason = reason;
            fine.waived_at = new Date();
            await fine.save({ session });
            waivedFines.push(fine);
          }

          remainingWaiver -= waiveAmount;
        }
      }

      // Update user's fine balance
      user.fines -= totalWaived;
      if (user.fines < 0) user.fines = 0;

      await user.save({ session });
      await session.commitTransaction();

      await logger.info("Fines waived successfully", {
        service: "BookService",
        method: "waiveFine",
        user_id: userId,
        admin_id: adminId,
        amount_waived: totalWaived,
        reason,
        remaining_fines: user.fines,
        waived_fines_count: waivedFines.length,
      });

      return {
        user: {
          _id: user._id,
          full_name: user.full_name,
          fines_remaining: user.fines,
        },
        waiver: {
          amount_waived: totalWaived,
          reason,
          waived_fines: waivedFines,
          waiver_count: waivedFines.length,
        },
      };
    } catch (error) {
      await session.abortTransaction();

      if (
        error.message.includes("waiver limit") ||
        error.message.includes("No outstanding fines") ||
        error.message.includes("exceeds outstanding fines")
      ) {
        throw new Error(error.message);
      }

      await logger.error(error, {
        service: "BookService",
        method: "waiveFine",
        user_id: userId,
      });

      throw new Error(ERROR_MESSAGES.CANNOT_WAIVE_FINE);
    } finally {
      session.endSession();
    }
  }

  // Get overdue books with advanced filtering
  async getOverdueBooks({ page = 1, limit = 20, days_overdue } = {}) {
    try {
      let query = {
        status: { $in: ["borrowed", "overdue"] },
        due_date: { $lt: new Date() },
      };

      if (days_overdue) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - parseInt(days_overdue));
        query.due_date.$lt = targetDate;
      }

      const overdueTransactions = await Transaction.find(query)
        .populate("user", "full_name identification_code email phone")
        .populate("book", "title author isbn")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ due_date: 1 });

      const total = await Transaction.countDocuments(query);

      // Calculate summary statistics
      const totalFines = overdueTransactions.reduce((sum, transaction) => {
        return sum + this.calculateFine(transaction.due_date, new Date());
      }, 0);

      const summary = {
        total_overdue: total,
        total_fines_potential: totalFines,
        average_days_overdue:
          overdueTransactions.length > 0
            ? overdueTransactions.reduce((sum, t) => {
                const days = Math.ceil(
                  (new Date() - t.due_date) / (1000 * 60 * 60 * 24)
                );
                return sum + days;
              }, 0) / overdueTransactions.length
            : 0,
      };

      return {
        overdueBooks: overdueTransactions,
        pagination: {
          total_pages: Math.ceil(total / limit),
          current_page: parseInt(page),
          total,
          limit: parseInt(limit),
        },
        summary,
      };
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "getOverdueBooks",
      });
      throw error;
    }
  }

  // Enhanced fine calculation with configurable rates
  calculateFine(dueDate, returnDate) {
    const daysOverdue = Math.ceil(
      (returnDate - dueDate) / (1000 * 60 * 60 * 24)
    );

    // Configurable fine structure
    const FINE_CONFIG = {
      RATE_PER_DAY: 5, // $5 per day
      MAX_FINE: 50, // Maximum fine cap
      GRACE_PERIOD_DAYS: 3, // 3-day grace period
      DAILY_CAP: 10, // Maximum per day
    };

    if (daysOverdue <= FINE_CONFIG.GRACE_PERIOD_DAYS) {
      return 0; // No fine during grace period
    }

    const effectiveDays = daysOverdue - FINE_CONFIG.GRACE_PERIOD_DAYS;
    const calculatedFine = Math.min(
      effectiveDays * FINE_CONFIG.RATE_PER_DAY,
      effectiveDays * FINE_CONFIG.DAILY_CAP
    );

    return Math.min(calculatedFine, FINE_CONFIG.MAX_FINE);
  }

  // Calculate damage fines
  calculateDamageFine(condition) {
    const damageRates = {
      excellent: 0,
      good: 0,
      fair: 5, // Minor wear
      poor: 15, // Significant damage
      damaged: 30, // Requires repair/replacement
      lost: 50, // Book lost
    };

    return damageRates[condition] || 0;
  }

  // Send overdue reminders
  async sendOverdueReminders(userIds = [], reminderType = "email") {
    try {
      let query = {
        status: { $in: ["borrowed", "overdue"] },
        due_date: { $lt: new Date() },
      };

      if (userIds.length > 0) {
        query.user = { $in: userIds };
      }

      const overdueTransactions = await Transaction.find(query)
        .populate("user")
        .populate("book");

      const sentReminders = [];

      for (const transaction of overdueTransactions) {
        try {
          // In a real implementation, you would integrate with email/SMS service
          const reminderResult = await this.sendReminder(
            transaction.user,
            transaction,
            reminderType
          );

          sentReminders.push({
            user_id: transaction.user._id,
            transaction_id: transaction._id,
            type: reminderType,
            sent_at: new Date(),
            success: true,
          });

          await logger.info("Overdue reminder sent", {
            service: "BookService",
            method: "sendOverdueReminders",
            user_id: transaction.user._id,
            transaction_id: transaction._id,
            reminder_type: reminderType,
          });
        } catch (error) {
          await logger.error("Failed to send reminder", {
            service: "BookService",
            method: "sendOverdueReminders",
            user_id: transaction.user._id,
            transaction_id: transaction._id,
            error: error.message,
          });
        }
      }

      return {
        sent: sentReminders.length,
        total_overdue: overdueTransactions.length,
        reminders: sentReminders,
      };
    } catch (error) {
      await logger.error(error, {
        service: "BookService",
        method: "sendOverdueReminders",
      });
      throw error;
    }
  }

  // Utility method to send actual reminders (to be implemented with email/SMS service)
  async sendReminder(user, transaction, type) {
    try {
      if (type === "email") {
        const daysOverdue = Math.ceil(
          (new Date() - transaction.due_date) / (1000 * 60 * 60 * 24)
        );
        const calculatedFine = this.calculateFine(
          transaction.due_date,
          new Date()
        );

        const overdueBook = {
          title: transaction.book.title,
          author: transaction.book.author,
          due_date: transaction.due_date,
          daysOverdue: daysOverdue,
          calculatedFine: calculatedFine,
        };

        // Determine reminder type based on days overdue
        let reminderType = "first";
        if (daysOverdue > 14) reminderType = "final";
        else if (daysOverdue > 7) reminderType = "second";

        await emailService.sendOverdueReminderEmail(
          user,
          [overdueBook],
          reminderType
        );

        return {
          success: true,
          message: `Email reminder sent to ${user.email}`,
        };
      }

      // Add SMS integration here if needed
      return { success: false, message: `Unsupported reminder type: ${type}` };
    } catch (error) {
      await logger.error("Failed to send reminder", {
        service: "BookService",
        method: "sendReminder",
        user_id: user._id,
        transaction_id: transaction._id,
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new BookService();
