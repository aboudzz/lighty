const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

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

/**
 * @openapi
 * /favicon.ico:
 *   get:
 *     description: get the favicon
 *     responses:
 *       200:
 *         description: return favicon.ico
 */
const faviconLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
});

router.get('/favicon.ico', faviconLimiter, (req, res, next) => {
    res.sendFile(path.join(__dirname, '../public/favicon.ico'));
});

module.exports = router;
