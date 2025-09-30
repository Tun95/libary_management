// backend_service/src/server.js - Main server file
const path = require("path");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

//use __dirname directly in CommonJS
const envPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: envPath });

const express = require("express");
const { setupRoutes } = require("./routes/routes");
const helmet = require("helmet");
const morgan = require("morgan");
const authMiddleware = require("./middlewares/auth.middleware");
const dynamicCors = require("./middlewares/cors.middleware");

const server = express();

//apply rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 60,
  message: {
    status: 429,
    message:
      "Too many requests from this IP, please  try again after 1 minutes",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

server.use(helmet());
server.use(dynamicCors);
server.use(morgan("combined"));
server.use(express.json({ limit: "50mb" }));

server.use("/api", [apiLimiter, authMiddleware]);

setupRoutes(server);

module.exports = server;
