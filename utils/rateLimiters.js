const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many attempts, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter };
