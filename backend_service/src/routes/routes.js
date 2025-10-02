const { HEALTH_STATUS } = require("../constants/constants");
const authController = require("../controllers/auth.controller");
const bookController = require("../controllers/book.controller");
const userController = require("../controllers/user.controller");
const isAdmin = require("../middlewares/admin.middleware");
const {
  registrationValidation,
  loginValidation,
  qrValidation,
  bookValidation,
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
    .get(bookController.getBooks)
    .post(isAdmin, bookValidation, bookController.addBook);

  server
    .route("/api/books/:id")
    .get(bookController.getBook)
    .put(isAdmin, requireActiveUser, bookValidation, bookController.updateBook)
    .delete(isAdmin, requireActiveUser, bookController.deleteBook);

  server
    .route("/api/books/borrow")
    .post(borrowBookValidation, bookController.borrowBook);

  server
    .route("/api/books/return")
    .post(returnBookValidation, bookController.returnBook);

  // ADMIN AND USER Routes
  // User Routes
  server
    .route("/api/users/me")
    .get(requireActiveUser, userController.getCurrentUser);
  server.route("/api/users/:id").get(requireActiveOnly, userController.getUser);
  server
    .route("/api/users/:id")
    .put(requireActiveOnly, userUpdateValidation, userController.updateUser);

  // Admin User Management Routes
  server
    .route("/api/admin/users")
    .get(isAdmin, requireActiveUser, userController.getUsers);
    
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
    .delete(isAdmin, requireActiveUser, userController.deleteUser);
  server
    .route("/api/admin/users/:id/permanent")
    .delete(isAdmin, requireActiveUser, userController.permanentlyDeleteUser);

  server.get("/health", async (req, res) => {
    res.status(200).json({ status: HEALTH_STATUS.UP });
  });

  server.get("/", async (req, res) => {
    res.status(200).json({ status: HEALTH_STATUS.UP });
  });
};

module.exports = { setupRoutes };
