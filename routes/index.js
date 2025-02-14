const express = require('express');
const router = express.Router();

const users = require('./users');
const admin = require('./admin');
const swagger = require('./swagger');

const isProduction = process.env.NODE_ENV === 'production';

router.use('/users', users);
router.use('/admin', admin);

if (!isProduction) {
    router.use('/api-docs', swagger);
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
router.get('/', (req, res, next) => res.send('Welcome to lighty!'));

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

module.exports = router;
