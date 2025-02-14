const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const passport = require('passport');

const middleware = require('../middlewares/users');

const jwtAuth = () => passport.authenticate('jwt', { session: false });

const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });

router.use(limiter);

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
 *       200:
 *         description: user found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       400:
 *         description: email is already registered
 */
router.post('/register', middleware.register);

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
router.get('/confirm', middleware.confirm);

/**
 * @openapi
 * /users/authenticate:
 *   post:
 *     summary: authenticate user
 *     tags: [users]
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
 *       400:
 *         description: email is not registered or incorrect password
 */
router.post('/authenticate', middleware.authenticate);

/**
 * @openapi
 * /users/forgotpassword:
 *   post:
 *     summary: send reset password email
 *     tags: [users]
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
router.post('/forgotpassword', middleware.forgotPassword);

/**
 * @openapi
 * /users/resetpassword:
 *   post:
 *     summary: reset password
 *     tags: [users]
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
router.post('/resetpassword', middleware.resetPassword);

/**
 * @openapi
 * /users/updatepassword:
 *   post:
 *     summary: update password
 *     tags: [users]
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
router.post('/updatepassword', jwtAuth(), middleware.updatePassword);

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
router.get('/:id', middleware.getUser);

module.exports = router;
