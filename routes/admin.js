const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const passport = require('passport');

const errors = require('../utils/errors');
const middleware = require('../middlewares/admin');

const jwtAuth = () => passport.authenticate('jwt', { session: false });

const isAdmin = (req, res, next) => {
  req.user.role === 'admin' ? next() : next(errors.UNAUTHORIZED);
};

const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });

router.use(jwtAuth(), isAdmin);
router.use(limiter);

router.route('/users')
  .get(middleware.getUsers);

router.route('/users/:id')
  .get(middleware.getUsers)
  .put(middleware.updateUser)
  .delete(middleware.deleteUser);

module.exports = router;
