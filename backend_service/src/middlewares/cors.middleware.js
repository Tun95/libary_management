// backend_service/src/middlewares/cors.middleware.js
const dynamicCors = (req, res, next) => {
  const allowOrigins = ["http://localhost:3000", "http://localhost:3001"];

  const origin = req.headers.origin;

  if (allowOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "OPTIONS"
  );

  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
};

module.exports = dynamicCors;
