var express = require('express')
var router = express.Router()
var passport = require('passport')

var errors = require('../utils/errors')
var middleware = require('../middlewares/admin')

const jwtAuth = () => {
  return passport.authenticate('jwt', { session: false });
};

const isAdmin = (req, res, next) => {
  req.user.role === 'admin' ? next() : next(errors.UNAUTHORIZED)
}

router.use(jwtAuth()).use(isAdmin)

router.get('/users', middleware.getUsers)

router.get('/users/:id', middleware.getUsers)

router.put('/users/:id', middleware.updateUser)

router.delete('/users/:id', middleware.deleteUser)

module.exports = router