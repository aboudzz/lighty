const express = require("express");
const router = express.Router();
const passport = require("passport");

const { authLimiter } = require("../utils/rateLimiters");
const middleware = require("../controllers/users");

const jwtAuth = () => passport.authenticate("jwt", { session: false });

/**
 * @openapi
 * /users/register:
 *   post:
 *     summary: register a new user
 *     tags: [users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: *userName
 *               email: *userEmail
 *               password: *userPassword
 *     responses:
 *       201:
 *         description: user created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: email is already registered
 */
router.post("/register", authLimiter, middleware.register);

/**
 * @openapi
 * /users/confirm:
 *   get:
 *     summary: confirm user email
 *     tags: [users]
 *     parameters:
 *       - in: query
 *         name: l
 *         description: lookup
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: v
 *         description: verify
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: user verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: invalid verification
 */
router.get("/confirm", authLimiter, middleware.confirm);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: get user by id
 *     tags: [users]
 *     security:
 *      - jwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: user found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: user not found
 */
router.get("/:id", jwtAuth(), middleware.getUser);

module.exports = router;
