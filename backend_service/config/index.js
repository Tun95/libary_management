module.exports = {
  port: process.env.PORT || 5000,
  db: {
    mongodb: {
      uri: process.env.MONGODB_URI || "",
    },
  },
  env: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "unilorin_library_secret_key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  logtail: {
    apikey: process.env.LOGTAIL_API_KEY || "",
    endpoint: process.env.LOGTAIL_ENDPOINT || "",
  },

  providers: {
    payment_gateway: {
      provider: process.env.PAYMENT_GATEWAY_PROVIDER || "paystack",
      authConfig: {
        development: {
          secretKey: process.env.PAYSTACK_SECRET_KEY || "",
          publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
        },
        production: {
          secretKey: process.env.PAYSTACK_SECRET_KEY || "",
          publicKey: process.env.PAYSTACK_PUBLIC_KEY || "",
        },
      },
    },

    email: {
      service: process.env.EMAIL_SERVICE || "gmail",
      username: process.env.EMAIL_USERNAME || "",
      password: process.env.EMAIL_PASSWORD || "",
    },
  },
  defaultProvider: {},
};
