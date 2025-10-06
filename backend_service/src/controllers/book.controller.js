// backend_service/src/controllers/book.controller.js
const logger = require("../../config/logger");
const { sendResponse } = require("../utils/utils");
const { ERROR_MESSAGES, STATUS } = require("../constants/constants");
const bookService = require("../services/book.service");

class BookController {
  // Get all books
  async getBooks(req, res) {
    try {
      const { page = 1, limit = 10, search, category, available } = req.query;
      const result = await bookService.getBooks({
        page,
        limit,
        search,
        category,
        available,
      });

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: result.books,
        pagination: result.pagination,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "getBooks",
      });

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Get all books for admin (including inactive books)
  async getAdminBooks(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        available,
        is_active,
      } = req.query;

      const result = await bookService.getAdminBooks({
        page,
        limit,
        search,
        category,
        available,
        is_active,
      });

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: result.books,
        pagination: result.pagination,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "getAdminBooks",
      });

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Get single book
  async getBook(req, res) {
    try {
      const { id } = req.params;
      const book = await bookService.getBookById(id);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: book,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "getBook",
        book_id: req.params.id,
      });

      if (error.message === ERROR_MESSAGES.BOOK_NOT_FOUND) {
        return sendResponse(res, 404, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Add new book (admin only)
  async addBook(req, res) {
    try {
      const bookData = req.body;
      const book = await bookService.addBook(bookData);

      return sendResponse(res, 201, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.BOOK_ADD_SUCCESS,
        data: book,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "addBook",
      });

      if (error.code === 11000) {
        return sendResponse(res, 409, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.DUPLICATE_ISBN,
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Update book (admin only)
  async updateBook(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const book = await bookService.updateBook(id, updateData);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.BOOK_UPDATE_SUCCESS,
        data: book,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "updateBook",
        book_id: req.params.id,
      });

      if (error.message === ERROR_MESSAGES.BOOK_NOT_FOUND) {
        return sendResponse(res, 404, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
        });
      }

      if (error.message.includes("Cannot reduce total copies")) {
        return sendResponse(res, 400, {
          status: STATUS.FAILED,
          message: error.message,
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Delete book (soft delete)
  async deleteBook(req, res) {
    try {
      const { id } = req.params;
      const book = await bookService.deleteBook(id);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.BOOK_DELETE_SUCCESS,
        data: book,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "deleteBook",
        book_id: req.params.id,
      });

      if (error.message === ERROR_MESSAGES.BOOK_NOT_FOUND) {
        return sendResponse(res, 404, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Permanent delete book (admin only)
  async permanentDeleteBook(req, res) {
    try {
      const { id } = req.params;
      const result = await bookService.permanentDeleteBook(id);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.BOOK_PERMANENT_DELETE_SUCCESS,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "permanentDeleteBook",
        book_id: req.params.id,
      });

      if (error.message === ERROR_MESSAGES.BOOK_NOT_FOUND) {
        return sendResponse(res, 404, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.BOOK_NOT_FOUND,
        });
      }

      if (error.message === ERROR_MESSAGES.BOOK_HAS_ACTIVE_BORROWS) {
        return sendResponse(res, 400, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.BOOK_HAS_ACTIVE_BORROWS,
          data: {
            borrow_count: error.borrowCount,
            active_borrows: error.activeBorrows,
            book_details: {
              book_id: req.params.id,
              title: error.bookTitle,
              author: error.bookAuthor,
            },
          },
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Borrow book
  async borrowBook(req, res) {
    try {
      const { book_id, user_id, due_date } = req.body;
      const transaction = await bookService.borrowBook(
        book_id,
        user_id,
        due_date
      );

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.BORROW_SUCCESS,
        data: transaction,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "borrowBook",
        book_id: req.body.book_id,
        user_id: req.body.user_id,
      });

      const statusCode =
        error.message === ERROR_MESSAGES.BOOK_NOT_FOUND ||
        error.message === ERROR_MESSAGES.USER_NOT_FOUND
          ? 404
          : error.message === ERROR_MESSAGES.NO_COPIES_AVAILABLE ||
            error.message === ERROR_MESSAGES.ALREADY_BORROWED ||
            error.message === ERROR_MESSAGES.ID_EXPIRED_BORROW ||
            error.message === ERROR_MESSAGES.OUTSTANDING_FINES ||
            error.message === ERROR_MESSAGES.BORROW_LIMIT_REACHED
          ? 400
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Enhanced Return book with multiple options
  async returnBook(req, res) {
    try {
      const { transaction_id, condition, notes, waive_fine } = req.body;
      const result = await bookService.returnBook(
        transaction_id,
        condition,
        notes,
        waive_fine
      );

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: result.message || ERROR_MESSAGES.RETURN_SUCCESS,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "returnBook",
        transaction_id: req.body.transaction_id,
      });

      const statusCode =
        error.message === ERROR_MESSAGES.TRANSACTION_NOT_FOUND
          ? 404
          : error.message === ERROR_MESSAGES.ALREADY_RETURNED ||
            error.message === ERROR_MESSAGES.CANNOT_WAIVE_FINE
          ? 400
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Bulk return books
  async bulkReturnBooks(req, res) {
    try {
      const { transaction_ids } = req.body;
      const results = await bookService.bulkReturnBooks(transaction_ids);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: `Processed ${results.processed} returns successfully`,
        data: results,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "bulkReturnBooks",
      });

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Get user fines
  async getUserFines(req, res) {
    try {
      const { userId } = req.params;
      const fines = await bookService.getUserFines(userId);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: fines,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "getUserFines",
        user_id: req.params.userId,
      });

      if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
        return sendResponse(res, 404, {
          status: STATUS.FAILED,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Pay fine
  async payFine(req, res) {
    try {
      const { user_id, amount, payment_method, transaction_ids, notes } =
        req.body;
      const result = await bookService.payFine(
        user_id,
        amount,
        payment_method,
        transaction_ids,
        notes
      );

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.FINE_PAYMENT_SUCCESS,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "payFine",
        user_id: req.body.user_id,
      });

      const statusCode =
        error.message === ERROR_MESSAGES.USER_NOT_FOUND ||
        error.message === ERROR_MESSAGES.TRANSACTION_NOT_FOUND
          ? 404
          : error.message === ERROR_MESSAGES.INSUFFICIENT_PAYMENT ||
            error.message === ERROR_MESSAGES.NO_OUTSTANDING_FINES
          ? 400
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Waive fine (admin only)
  async waiveFine(req, res) {
    try {
      const { user_id, amount, transaction_ids, reason } = req.body;
      const result = await bookService.waiveFine(
        user_id,
        amount,
        transaction_ids,
        reason
      );

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.FINE_WAIVED_SUCCESS,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "waiveFine",
        user_id: req.body.user_id,
      });

      const statusCode =
        error.message === ERROR_MESSAGES.USER_NOT_FOUND ||
        error.message === ERROR_MESSAGES.TRANSACTION_NOT_FOUND
          ? 404
          : error.message === ERROR_MESSAGES.CANNOT_WAIVE_FINE
          ? 400
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Get overdue books
  async getOverdueBooks(req, res) {
    try {
      const { page = 1, limit = 20, days_overdue } = req.query;
      const result = await bookService.getOverdueBooks({
        page,
        limit,
        days_overdue,
      });

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        data: result.overdueBooks,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "getOverdueBooks",
      });

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Send overdue reminders
  async sendOverdueReminders(req, res) {
    try {
      const { user_ids, reminder_type } = req.body;
      const result = await bookService.sendOverdueReminders(
        user_ids,
        reminder_type
      );

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: `Reminders sent to ${result.sent} users`,
        data: result,
      });
    } catch (error) {
      await logger.error(error, {
        controller: "BookController",
        method: "sendOverdueReminders",
      });

      return sendResponse(res, 500, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }
}

module.exports = new BookController();
