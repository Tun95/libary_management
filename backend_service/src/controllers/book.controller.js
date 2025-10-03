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
            error.message === ERROR_MESSAGES.OUTSTANDING_FINES
          ? 400
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }

  // Return book
  async returnBook(req, res) {
    try {
      const { transaction_id } = req.body;
      const result = await bookService.returnBook(transaction_id);

      return sendResponse(res, 200, {
        status: STATUS.SUCCESS,
        message: ERROR_MESSAGES.RETURN_SUCCESS,
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
          : error.message === ERROR_MESSAGES.ALREADY_RETURNED
          ? 400
          : 500;

      return sendResponse(res, statusCode, {
        status: STATUS.FAILED,
        message: error.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  }
}

module.exports = new BookController();
