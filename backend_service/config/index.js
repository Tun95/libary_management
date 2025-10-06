module.exports = {
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  backendUrl: process.env.BACKEND_URL || "http://localhost:5000",
  webName: process.env.WEB_NAME || "Library Management",
  
  libraryAddress:
    process.env.LIBRARY_ADDRESS || "123 Library Lane, Campus City",
  libraryPhone: process.env.LIBRARY_PHONE || "(555) 123-4567",
  libraryEmail: process.env.LIBRARY_EMAIL || "library@university.edu",

  db: {
    mongodb: {
      uri: process.env.MONGODB_URI || "",
    },
  },
  env: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "library_secret_key",
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
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE || false,
      username: process.env.EMAIL_USERNAME || "your_email@gmail.com",
      password: process.env.EMAIL_PASSWORD || "your_email_password",
    },
  },
  defaultProvider: {},
};
