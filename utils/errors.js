const createError = require('http-errors');
const debug = require('debug')('debug:errors');

const errors = {

    BAD_REQUEST: () => createError(400, 'Bad request'),

    NOT_FOUND: () => createError(404, 'Requested entity not found'),

    UNAUTHORIZED: () => createError(403, 'Access denied'),

    LINK_EXPIRED: () => createError(410, 'Requested link expired'),

    EMAIL_ALREADY_REGISTERED: () => createError(400, 'Email is already registered'),

    EMAIL_NOT_REGISTERED: () => createError(400, 'Email is not registered'),

    INCORRECT_PASSWORD: () => createError(400, 'Incorrect password'),

    error404: (req, res, next) => {
        next(createError(404, `Requested URL: \`${req.method} ${req.url}\` not found`));
    },

    handler: (err, req, res, next) => {
        debug(err);
        console.error(err.code || "INTERNAL_SERVER_ERROR", ":", err.message);
        res.status(err.status || 500).json({
            code: err.code || "INTERNAL_SERVER_ERROR",
            message: process.env.NODE_ENV !== 'production' ? err.message : undefined
        });
    }
}

module.exports = errors;
