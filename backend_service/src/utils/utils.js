const config = require("../../config");

// Environment Modes
const isStaging = config.env === "staging" || config.env === "development";

function sendResponse(res, status, data) {
  return res.status(status).json(data);
}

module.exports = { isStaging, sendResponse };
