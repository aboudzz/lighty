const express = require('express');
const router = express.Router();

const users = require('./users');
const admin = require('./admin');

router.get('/ping', (req, res, next) => res.send('pong'));

router.use('/users', users);

router.use('/admin', admin);

module.exports = router;
