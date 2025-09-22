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

  providers: {
    paystack: {
      provider: process.env.PAYSTACK_PROVIDER || "paystack",
      authConfig: {
        development: {
          secretKey:
            process.env.PAYSTACK_SECRET_KEY ||
            "sk_test_your_paystack_test_secret_key",
          publicKey:
            process.env.PAYSTACK_PUBLIC_KEY ||
            "pk_test_your_paystack_test_public_key",
        },
        production: {
          secretKey:
            process.env.PAYSTACK_SECRET_KEY ||
            "sk_live_your_paystack_live_secret_key",
          publicKey:
            process.env.PAYSTACK_PUBLIC_KEY ||
            "pk_live_your_paystack_live_public_key",
        },
      },
    },

    email: {
      service: process.env.EMAIL_SERVICE || "gmail",
      username: process.env.EMAIL_USERNAME || "your_email@gmail.com",
      password: process.env.EMAIL_PASSWORD || "your_email_password",
    },
  },
  defaultProvider: {},
};
