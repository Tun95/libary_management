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
} = require("../utils/validators");

setupRoutes = (server) => {
  // Auth Routes
  server
    .route("/auth/register")
    .post(registrationValidation, authController.register);

  server.route("/auth/login").post(loginValidation, authController.login);

  server
    .route("/auth/verify-qr")
    .post(qrValidation, authController.verifyQR);

  // Book Routes
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

  // User Routes
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
