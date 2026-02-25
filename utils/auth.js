const errors = require("./errors");

const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") return next(errors.FORBIDDEN);
    next();
};

module.exports = { isAdmin };
