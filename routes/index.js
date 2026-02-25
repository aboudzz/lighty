const express = require("express");
const path = require("node:path");
const mongoose = require("mongoose");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const users = require("./users");
const admin = require("./admin");
const auth = require("./auth");
const swagger = require("./swagger");

const isProduction = process.env.NODE_ENV === "production";

// API v1 routes
const v1Router = express.Router();
v1Router.use("/users", users);
v1Router.use("/admin", admin);
v1Router.use("/auth", auth);

// Mount API v1
router.use("/api/v1", v1Router);

// Legacy routes (deprecated — remove in v1.0.0)
// These duplicate /api/v1/* routes at the root level for backward compatibility.
// Set DISABLE_LEGACY_ROUTES=true to disable them early.
const deprecationNotice = (req, res, next) => {
    res.set("Deprecation", "true");
    res.set("Link", '</api/v1>; rel="successor-version"');
    next();
};
if (process.env.DISABLE_LEGACY_ROUTES !== "true") {
    router.use("/users", deprecationNotice, users);
    router.use("/admin", deprecationNotice, admin);
    router.use("/auth", deprecationNotice, auth);
}

if (!isProduction) {
    router.use("/swagger", swagger);
}

/**
 * @openapi
 * /:
 *   get:
 *     description: welcome to lighty
 *     responses:
 *       200:
 *         description: show welcome message
 */
router.get("/", (req, res) => res.send("Welcome to lighty!"));

/**
 * @openapi
 * /ping:
 *   get:
 *     description: play ping-pong with server
 *     responses:
 *       200:
 *         description: reply with pong.
 */
router.get("/ping", (req, res) => res.send("pong"));

/**
 * @openapi
 * /health:
 *   get:
 *     description: health check with database connectivity status
 *     responses:
 *       200:
 *         description: service is healthy
 *       503:
 *         description: service is unhealthy
 */
router.get("/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const isHealthy = dbState === 1;
    const status = isHealthy ? 200 : 503;
    res.status(status).json({
        status: isHealthy ? "ok" : "degraded",
        db: isHealthy ? "connected" : "disconnected",
    });
});

const faviconLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
});

/**
 * @openapi
 * /favicon.ico:
 *   get:
 *     description: get the favicon
 *     responses:
 *       200:
 *         description: return favicon.ico
 */
router.get("/favicon.ico", faviconLimiter, (req, res, _next) => {
    res.sendFile(path.join(__dirname, "../public/favicon.ico"));
});

module.exports = router;
