const createError = require('http-errors');
const debug = require('debug')('debug:errors');

const errorDefs = {
    BAD_REQUEST:              [400, 'Bad request'],
    NOT_FOUND:                [404, 'Requested entity not found'],
    UNAUTHORIZED:             [401, 'Authentication required'],
    FORBIDDEN:                [403, 'Access denied'],
    LINK_EXPIRED:             [410, 'Requested link expired'],
    INVALID_CREDENTIALS:      [401, 'Invalid email or password'],
    EMAIL_ALREADY_REGISTERED: [400, 'Email is already registered'],
    EMAIL_NOT_REGISTERED:     [400, 'Email is not registered'],
    INCORRECT_PASSWORD:       [400, 'Incorrect password'],
};

const errors = {
    error404: (req, res, next) => {
        next(createError(404, `Requested URL: \`${req.method} ${req.url}\` not found`));
    },

    handler: (err, req, res, next) => {
        debug(err);

        // Map Mongoose errors to 400
        if (err.name === 'CastError' || err.name === 'ValidationError') {
            err.status = 400;
            err.code = err.code || 'BAD_REQUEST';
        }

        const status = err.status || 500;

        if (status >= 500) {
            console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);
        }

        res.status(status).json({
            code: err.code || "INTERNAL_SERVER_ERROR",
            message: process.env.NODE_ENV === 'production' ? undefined : err.message
        });
    }
};

for (const [code, [status, message]] of Object.entries(errorDefs)) {
    Object.defineProperty(errors, code, {
        get: () => createError(status, message, { code }),
        enumerable: true,
    });
}

module.exports = errors;
