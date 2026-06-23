const passport = require("passport");
const errors = require("./errors");

const isAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") return next(errors.FORBIDDEN);
    next();
};

const jwtAuth = passport.authenticate("jwt", { session: false });

module.exports = { isAdmin, jwtAuth };
