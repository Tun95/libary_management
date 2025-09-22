module.exports = {
  port: process.env.PORT || 5000,
  db: {
    mongodb: {
      uri:
        process.env.MONGODB_URI || "mongodb://localhost:27017/unilorin_library",
    },
  },
  env: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "unilorin_library_secret_key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  logtail: {
    apikey: process.env.LOGTAIL_API_KEY || "your_logtail_api_key_here",
    endpoint: process.env.LOGTAIL_ENDPOINT || "your_logtail_endpoint_here",
  },

  providers: {},
  defaultProvider: {},
};
