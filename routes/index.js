const express = require('express');
const router = express.Router();

const users = require('./users');
const admin = require('./admin');
const swagger = require('./swagger');

/**
 * @openapi
 * /ping:
 *   get:
 *     description: play ping-pong with server
 *     responses:
 *       200:
 *         description: reply with pong.
 */
router.get('/ping', (req, res, next) => res.send('pong'));

router.use('/users', users);

router.use('/admin', admin);

router.use('/api-docs', swagger);

module.exports = router;
