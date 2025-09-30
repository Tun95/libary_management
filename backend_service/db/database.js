// backend_service/db/database.js - Database configuration
const mongoose = require("mongoose");
const config = require("../config/index");

const connectDB = async () => {
  try {
    await mongoose.connect(config.db.mongodb.uri);
    console.log(`Connected to db successfully`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
