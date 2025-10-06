// models/fine.model.js
const mongoose = require("mongoose");

const fineSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["outstanding", "paid", "waived", "overdue"],
      default: "outstanding",
    },
    due_date: {
      type: Date,
      required: true,
    },
    paid_date: Date,
    payment_method: String,
    payment_notes: String,
    waived_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    waived_reason: String,
    waived_at: Date,
  },
  {
    timestamps: true,
  }
);

const Fine = mongoose.model("Fine", fineSchema);
module.exports = Fine;
