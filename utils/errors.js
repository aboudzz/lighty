const createError = require("http-errors");
const logger = require("./logger").child({ module: "errors" });

const errorDefs = {
    BAD_REQUEST: [400, "Bad request"],
    NOT_FOUND: [404, "Requested entity not found"],
    UNAUTHORIZED: [401, "Authentication required"],
    FORBIDDEN: [403, "Access denied"],
    LINK_EXPIRED: [410, "Requested link expired"],
    INVALID_CREDENTIALS: [401, "Invalid email or password"],
    EMAIL_ALREADY_REGISTERED: [400, "Email is already registered"],
    EMAIL_NOT_REGISTERED: [400, "Email is not registered"],
    INCORRECT_PASSWORD: [400, "Incorrect password"],
};

const errors = {
    error404: (req, res, next) => {
        next(
            createError(
                404,
                `Requested URL: \`${req.method} ${req.url}\` not found`,
            ),
        );
    },

    handler: (err, req, res, _next) => {
        // Map Mongoose errors to 400
        if (err.name === "CastError" || err.name === "ValidationError") {
            err.status = 400;
            err.code = err.code || "BAD_REQUEST";
        }

        const status = err.status || 500;
        const logData = { err, reqId: req.id };

        if (status >= 500) {
            // Include redacted body for 5xx to aid debugging
            const body = req.body ? { ...req.body } : undefined;
            if (body) {
                for (const key of ["password", "oldPassword", "newPassword"]) {
                    if (body[key]) body[key] = "[REDACTED]";
                }
            }
            logData.body = body;
            logger.error(
                logData,
                "%s %s - %s",
                req.method,
                req.url,
                err.message,
            );
        } else {
            logger.warn(
                logData,
                "%s %s - %s",
                req.method,
                req.url,
                err.message,
            );
        }

        res.status(status).json({
            code: err.code || "INTERNAL_SERVER_ERROR",
            // Error details shown in dev/test only — never in production
            message:
                process.env.NODE_ENV === "production" ? undefined : err.message,
        });
    },
};

for (const [code, [status, message]] of Object.entries(errorDefs)) {
    Object.defineProperty(errors, code, {
        get: () => createError(status, message, { code }),
        enumerable: true,
    });
}

module.exports = errors;
