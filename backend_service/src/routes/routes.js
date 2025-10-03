const { HEALTH_STATUS } = require("../constants/constants");
const authController = require("../controllers/auth.controller");
const bookController = require("../controllers/book.controller");
const userController = require("../controllers/user.controller");
const isAdmin = require("../middlewares/admin.middleware");
const {
  registrationValidation,
  loginValidation,
  qrValidation,

  getBooksValidation,
  bookCreateValidation,
  bookUpdateValidation,
  returnBookValidation,
  borrowBookValidation,

  userUpdateValidation,
  verifyLoginOtpValidation,
  resendOtpValidation,
  verifyEmailOtpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyResetTokenValidation,
  changePasswordValidation,
  requireActiveUser,
  requireActiveOnly,
  userStatusValidation,
  getUsersValidation,
  idValidation,
  permanentDeleteValidation,
} = require("../utils/validators");

setupRoutes = (server) => {
  // AUTH Routes
  server
    .route("/auth/register")
    .post(registrationValidation, authController.register);

  server
    .route("/auth/verify-email-otp")
    .post(verifyEmailOtpValidation, authController.verifyEmailOtp);

  server
    .route("/auth/resend-verification-otp")
    .post(resendOtpValidation, authController.resendVerificationOtp);

  server.route("/auth/login").post(loginValidation, authController.login);

  server
    .route("/auth/verify-login-otp")
    .post(verifyLoginOtpValidation, authController.verifyLoginOtp);

  server.route("/auth/verify-qr").post(qrValidation, authController.verifyQR);

  // Password Reset Routes
  server
    .route("/auth/forgot-password")
    .post(forgotPasswordValidation, authController.forgotPassword);

  server
    .route("/auth/reset-password")
    .post(resetPasswordValidation, authController.resetPassword);

  server
    .route("/auth/verify-reset-token")
    .post(verifyResetTokenValidation, authController.verifyResetToken);

  server
    .route("/api/auth/change-password")
    .post(
      changePasswordValidation,
      requireActiveUser,
      authController.changePassword
    );

  // BOOK Routes
  server
    .route("/api/books")
    .get(getBooksValidation, bookController.getBooks)
    .post(
      isAdmin,
      requireActiveUser,
      bookCreateValidation,
      bookController.addBook
    );

  server
    .route("/api/admin/books")
    .get(
      isAdmin,
      requireActiveUser,
      getBooksValidation,
      bookController.getAdminBooks
    );

  server
    .route("/api/books/:id")
    .get(idValidation, bookController.getBook)
    .put(
      isAdmin,
      requireActiveUser,
      idValidation,
      bookUpdateValidation,
      bookController.updateBook
    )
    .delete(
      isAdmin,
      requireActiveUser,
      idValidation,
      bookController.deleteBook
    );

  server
    .route("/api/books/:id/permanent")
    .delete(
      isAdmin,
      requireActiveUser,
      idValidation,
      bookController.permanentDeleteBook
    );

  server
    .route("/api/books/borrow")
    .post(requireActiveUser, borrowBookValidation, bookController.borrowBook);

  server
    .route("/api/books/return")
    .post(requireActiveUser, returnBookValidation, bookController.returnBook);

  // ADMIN AND USER Routes
  // User Routes
  server
    .route("/api/users/me")
    .get(requireActiveUser, userController.getCurrentUser);

  server
    .route("/api/users/:id")
    .get(requireActiveOnly, idValidation, userController.getUser)
    .put(requireActiveOnly, userUpdateValidation, userController.updateUser);

  // Admin User Management Routes
  server
    .route("/api/admin/users")
    .get(
      isAdmin,
      requireActiveUser,
      getUsersValidation,
      userController.getUsers
    );

  server
    .route("/api/admin/users/stats")
    .get(isAdmin, requireActiveUser, userController.getUserStats);

  server
    .route("/api/admin/users/:id/status")
    .put(
      isAdmin,
      requireActiveUser,
      userStatusValidation,
      userController.updateUserStatus
    );

  server
    .route("/api/admin/users/:id")
    .delete(
      isAdmin,
      requireActiveUser,
      idValidation,
      userController.deleteUser
    );

  server
    .route("/api/admin/users/:id/permanent")
    .delete(
      isAdmin,
      requireActiveUser,
      permanentDeleteValidation,
      userController.permanentlyDeleteUser
    );

  server.get("/health", async (req, res) => {
    res.status(200).json({ status: HEALTH_STATUS.UP });
  });

  server.get("/", async (req, res) => {
    res.status(200).json({ status: HEALTH_STATUS.UP });
  });
};

module.exports = { setupRoutes };
