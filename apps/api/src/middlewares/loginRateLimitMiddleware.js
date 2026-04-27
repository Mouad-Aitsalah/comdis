const rateLimit = require("express-rate-limit");

const loginRateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de tentatives. Reessayez plus tard.",
  },
});

module.exports = loginRateLimitMiddleware;
