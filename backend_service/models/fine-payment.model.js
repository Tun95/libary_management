// models/fine-payment.model.js
const mongoose = require("mongoose");

const finePaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    payment_method: {
      type: String,
      required: true,
      enum: ["cash", "credit_card", "debit_card", "online", "check"],
    },
    transaction_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    paid_fines: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Fine",
      },
    ],
    notes: String,
    receipt_number: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate receipt number before save
finePaymentSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.receipt_number = `RCP-${Date.now()}-${count + 1}`;
  }
  next();
});


const FinePayment = mongoose.model("FinePayment", finePaymentSchema);
module.exports = FinePayment;
