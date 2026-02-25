const express = require('express');
const router = express.Router();
const passport = require('passport');
const rateLimit = require('express-rate-limit');

const middleware = require('../controllers/users');

const jwtAuth = () => passport.authenticate('jwt', { session: false });

// Stricter rate limiting for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

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
router.post('/register', authLimiter, middleware.register);

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
router.get('/confirm', authLimiter, middleware.confirm);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: get user by id
 *     tags: [users]
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
router.get('/:id', jwtAuth(), middleware.getUser);

module.exports = router;
