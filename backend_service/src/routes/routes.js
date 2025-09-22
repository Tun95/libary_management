const { HEALTH_STATUS } = require("../constants/constants");

setupRoutes = (server) => {
  // EXAMPLE
  // server
  //   .route("/api/asset-codes")
  //   .post(isAdmin, createAssetCodeValidation, assetsController.createAssetCode)
  //   .get(assetsController.getAllAssetCodes);

  server.get("/health", async (req, res) => {
    res.status(200).json({ status: HEALTH_STATUS.UP });
  });

  server.get("/", async (req, res) => {
    res.status(200).json({ status: HEALTH_STATUS.UP });
  });
};

module.exports = { setupRoutes };
