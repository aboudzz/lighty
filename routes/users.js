const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const passport = require('passport');

const middleware = require('../middlewares/users');

const jwtAuth = () => passport.authenticate('jwt', { session: false });

const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });

router.use(limiter);

router.post('/register', middleware.register);

router.get('/confirm', middleware.confirm);

router.post('/authenticate', middleware.authenticate);

router.post('/forgotpassword', middleware.forgotPassword);

router.post('/resetpassword', middleware.resetPassword);

router.post('/updatepassword', jwtAuth(), middleware.updatePassword);

router.get('/:id', middleware.getUser);

module.exports = router;
