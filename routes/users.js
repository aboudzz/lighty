var express = require('express')
var router = express.Router()
var passport = require('passport')

var middleware = require('../middlewares/users')

const jwtAuth = () => {
  return passport.authenticate('jwt', { session: false });
};

router.post('/register', middleware.register)

router.get('/confirm', middleware.confirm)

router.post('/authenticate', middleware.authenticate)

router.post('/forgotpassword', middleware.forgotPassword)

router.post('/resetpassword', middleware.resetPassword)

router.post('/updatepassword', jwtAuth(), middleware.updatePassword)

router.get('/:id', middleware.getUser)

module.exports = router
