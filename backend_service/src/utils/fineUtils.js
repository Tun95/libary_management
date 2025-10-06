// backend_service/src/utils/fineUtils.js
const { FINE_CONFIG, ERROR_MESSAGES } = require("../constants/constants");
const Fine = require("../../models/fine.model");
const User = require("../../models/user.model");

class FineUtils {
  // Check if user has reached waiver limit
  static async checkWaiverLimit(userId) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const waiverCount = await Fine.countDocuments({
      user: userId,
      status: "waived",
      waived_at: { $gte: startOfMonth },
    });

    return waiverCount >= FINE_CONFIG.WAIVER_LIMIT_PER_MONTH;
  }

  // Calculate total fines for a user
  static async calculateTotalFines(userId) {
    const fines = await Fine.find({
      user: userId,
      status: { $in: ["outstanding", "overdue"] },
    });

    return fines.reduce((total, fine) => total + fine.amount, 0);
  }

  // Validate fine waiver eligibility
  static async validateWaiverEligibility(userId, amount, transactionIds = []) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user.fines <= 0) {
      throw new Error(ERROR_MESSAGES.NO_OUTSTANDING_FINES);
    }

    // Check waiver limit
    const waiverLimitReached = await this.checkWaiverLimit(userId);
    if (waiverLimitReached) {
      throw new Error(ERROR_MESSAGES.WAIVER_LIMIT_EXCEEDED);
    }

    // Validate specific transactions if provided
    if (transactionIds.length > 0) {
      const fines = await Fine.find({
        _id: { $in: transactionIds },
        user: userId,
        status: { $in: ["outstanding", "overdue"] },
      });

      if (fines.length !== transactionIds.length) {
        throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
      }

      const totalFines = fines.reduce((sum, fine) => sum + fine.amount, 0);
      if (amount && amount > totalFines) {
        throw new Error(ERROR_MESSAGES.WAIVER_AMOUNT_EXCEEDS_FINES);
      }
    } else if (amount && amount > user.fines) {
      throw new Error(ERROR_MESSAGES.WAIVER_AMOUNT_EXCEEDS_FINES);
    }

    return true;
  }

  // Generate fine report
  static async generateFineReport(startDate, endDate) {
    const fines = await Fine.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate("user", "full_name identification_code email")
      .populate("transaction")
      .sort({ createdAt: -1 });

    const summary = {
      total_fines: fines.length,
      total_amount: fines.reduce((sum, fine) => sum + fine.amount, 0),
      paid_fines: fines.filter((f) => f.status === "paid").length,
      paid_amount: fines
        .filter((f) => f.status === "paid")
        .reduce((sum, f) => sum + f.amount, 0),
      waived_fines: fines.filter((f) => f.status === "waived").length,
      waived_amount: fines
        .filter((f) => f.status === "waived")
        .reduce((sum, f) => sum + f.amount, 0),
      outstanding_fines: fines.filter((f) => f.status === "outstanding").length,
      outstanding_amount: fines
        .filter((f) => f.status === "outstanding")
        .reduce((sum, f) => sum + f.amount, 0),
    };

    return {
      summary,
      fines,
      period: { startDate, endDate },
    };
  }
}

module.exports = FineUtils;
