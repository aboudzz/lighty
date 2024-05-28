const express = require('express');
const router = express.Router();
const passport = require('passport');

const middleware = require('../middlewares/users');

const jwtAuth = () => passport.authenticate('jwt', { session: false });

router.post('/register', middleware.register);

router.get('/confirm', middleware.confirm);

router.post('/authenticate', middleware.authenticate);

router.post('/forgotpassword', middleware.forgotPassword);

router.post('/resetpassword', middleware.resetPassword);

router.post('/updatepassword', jwtAuth(), middleware.updatePassword);

router.get('/:id', middleware.getUser);

module.exports = router;
