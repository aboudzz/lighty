const express = require('express');
const router = express.Router();
const passport = require('passport');

const errors = require('../utils/errors');
const middleware = require('../middlewares/admin');

const jwtAuth = () => passport.authenticate('jwt', { session: false });

const isAdmin = (req, res, next) => {
  req.user.role === 'admin' ? next() : next(errors.UNAUTHORIZED);
};

router.use(jwtAuth(), isAdmin);

router.route('/users')
  .get(middleware.getUsers);

router.route('/users/:id')
  .get(middleware.getUsers)
  .put(middleware.updateUser)
  .delete(middleware.deleteUser);

module.exports = router;
