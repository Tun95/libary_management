// backend_service/index.js - Main entry point
const log = require("debug")("server.js");

const server = require("./src/server");
const config = require("./config/index");
const connectDB = require("./db/database");

// Connect to database
connectDB();

server.listen(config.port, () => {
  log("Server is running on port " + config.port);
});
