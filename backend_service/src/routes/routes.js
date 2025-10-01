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
    .post(changePasswordValidation, authController.changePassword);

  // BOOK Routes
  server
    .route("/api/books")
    .get(bookController.getBooks)
    .post(isAdmin, bookValidation, bookController.addBook);

  server
    .route("/api/books/:id")
    .get(bookController.getBook)
    .put(isAdmin, bookValidation, bookController.updateBook)
    .delete(isAdmin, bookController.deleteBook);

  server
    .route("/api/books/borrow")
    .post(borrowBookValidation, bookController.borrowBook);

  server
    .route("/api/books/return")
    .post(returnBookValidation, bookController.returnBook);

  // USER Routes
  server.route("/api/users").get(isAdmin, userController.getUsers);

  server
    .route("/api/users/:id")
    .get(userController.getUser)
    .put(userUpdateValidation, userController.updateUser);

  server.get("/health", async (req, res) => {
    res.status(200).json({ status: HEALTH_STATUS.UP });
  });

  server.get("/", async (req, res) => {
    res.status(200).json({ status: HEALTH_STATUS.UP });
  });
};

module.exports = { setupRoutes };
