const express = require('express');
const router = express.Router();
const passport = require('passport');

const { isAdmin } = require('../utils/auth');
const middleware = require('../controllers/admin');

const jwtAuth = () => passport.authenticate('jwt', { session: false });

router.use(jwtAuth(), isAdmin);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: Retrieve a list of users
 *     tags: [admin]
 *     security:
 *      - jwtAuth: []
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *                 count:
 *                   type: integer
 */
router.route('/users')
  .get(middleware.listUsers);

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     summary: Retrieve a user by ID
 *     tags: [admin]
 *     security:
 *      - jwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: A user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *   patch:
 *     summary: Update a user by ID
 *     tags: [admin]
 *     security:
 *      - jwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProperties'
 *     responses:
 *       200:
 *         description: The updated user object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [admin]
 *     security:
 *      - jwtAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: deletion acknowledged.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 acknowledged:
 *                   type: boolean
 *                 deletedCount:
 *                   type: integer
 */
router.route('/users/:id')
  .get(middleware.getUser)
  .patch(middleware.updateUser)
  .delete(middleware.deleteUser);

module.exports = router;
