var debug = require('debug')('debug:errors')


const errors = module.exports = {

    BAD_REQUEST: {
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Bad request'
    },

    NOT_FOUND: {
        status: 400,
        code: 'NOT_FOUND',
        message: 'Requested entity not found'
    },

    UNAUTHORIZED: {
        status: 403,
        code: 'UNAUTHORIZED',
        message: 'Access denied'
    },

    LINK_EXPIRED: {
        status: 410,
        code: 'LINK_EXPIRED',
        message: 'requested link expired'
    },

    EMAIL_ALREADY_REGISTERED: {
        status: 400,
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'Email is already registered'
    },

    EMAIL_NOT_REGISTERED: {
        status: 400,
        code: 'EMAIL_NOT_REGISTERED',
        message: 'Email is not registered'
    },

    INCORRECT_PASSWORD: {
        status: 400,
        code: 'INCORRECT_PASSWORD',
        message: 'Incorrect password'
    },

    error404: (req, res, next) => {
        next({
            status: 404,
            code: '404_NOT_FOUND',
            message: `Requested URL: \`${req.method} ${req.url}\` not found`
        })
    },

    handler: (err, req, res, next) => {
        debug(err)
        console.error(err.code || "INTERNAL_SERVER_ERROR", ":", err.message)
        res.status(err.status || 500).json({
            code: err.code || "INTERNAL_SERVER_ERROR",
            message: process.env.NODE_ENV !== 'production' ? err.message : undefined
        })
    }
}