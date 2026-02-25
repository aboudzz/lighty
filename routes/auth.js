const express = require("express");
const router = express.Router();
const passport = require("passport");

const { authLimiter } = require("../utils/rateLimiters");
const middleware = require("../controllers/users");

const jwtAuth = () => passport.authenticate("jwt", { session: false });

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: authenticate user
 *     tags: [auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: *userEmail
 *               password: *userPassword
 *     responses:
 *       200:
 *         description: user authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfileWithToken'
 *       401:
 *         description: invalid credentials
 */
router.post("/login", authLimiter, middleware.authenticate);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: send reset password email
 *     tags: [auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: *userEmail
 *     responses:
 *       200:
 *         description: forgot password request received
 */
router.post("/forgot-password", authLimiter, middleware.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: reset password
 *     tags: [auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               lookup:
 *                 type: string
 *               verify:
 *                 type: string
 *               password: *userPassword
 *     responses:
 *       200:
 *         description: password reset
 *       400:
 *         description: invalid verification
 */
router.post("/reset-password", authLimiter, middleware.resetPassword);

/**
 * @openapi
 * /auth/update-password:
 *   post:
 *     summary: update password
 *     tags: [auth]
 *     security:
 *      - jwtAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: password updated
 *       400:
 *         description: incorrect old password
 *       401:
 *         description: unauthorized
 */
router.post("/update-password", jwtAuth(), middleware.updatePassword);

module.exports = router;
