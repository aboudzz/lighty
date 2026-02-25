const User = require("../models/User");

const errors = require("../utils/errors");
const logger = require("../utils/logger").child({ module: "admin" }); // eslint-disable-line no-unused-vars
const { escapeRegExp } = require("../utils/helpers");
const {
    validateEmail,
    validateName,
    validateRole,
    validateConfirmed,
} = require("../utils/validation");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ALLOWED_SORT_FIELDS = new Set([
    "name",
    "email",
    "role",
    "confirmed",
    "createdAt",
    "updatedAt",
]);

const sanitizeUpdateFields = (body) => {
    const allowedFields = new Set(["name", "email", "role", "confirmed"]);

    if (!body || typeof body !== "object") {
        throw errors.BAD_REQUEST;
    }

    for (const field of Object.keys(body)) {
        if (!allowedFields.has(field)) {
            throw errors.BAD_REQUEST;
        }
    }

    const sanitized = {};

    if (body.name) {
        sanitized.name = validateName(body.name);
    }

    if (body.email) {
        sanitized.email = validateEmail(body.email);
    }

    if (body.role) {
        sanitized.role = validateRole(body.role);
    }

    if ("confirmed" in body) {
        sanitized.confirmed = validateConfirmed(body.confirmed);
    }

    return sanitized;
};

module.exports = {
    getUser: async (req, res, next) => {
        const user = await User.findById(req.params.id);
        if (!user) return next(errors.NOT_FOUND);
        res.json(user.getProfile());
    },

    listUsers: async (req, res, _next) => {
        const findQuery = {};
        if (req.query.search) {
            const regexp = new RegExp(escapeRegExp(req.query.search), "i");
            findQuery.$or = [{ name: regexp }, { email: regexp }];
        }

        const sortField = ALLOWED_SORT_FIELDS.has(req.query.sort)
            ? req.query.sort
            : "updatedAt";
        const sortQuery = { [sortField]: 1 };
        const limit = Math.min(
            Math.max(1, Number.parseInt(req.query.limit, 10)) || DEFAULT_LIMIT,
            MAX_LIMIT,
        );
        const skip = Math.max(0, Number.parseInt(req.query.skip, 10)) || 0;

        const dataCursor = User.find(findQuery)
            .sort(sortQuery)
            .limit(limit)
            .skip(skip)
            .select([
                "_id",
                "name",
                "email",
                "role",
                "confirmed",
                "createdAt",
                "updatedAt",
            ])
            .exec();

        const countCursor = User.find(findQuery).countDocuments();

        const [data, count] = await Promise.all([dataCursor, countCursor]);
        res.json({ data, count });
    },

    updateUser: async (req, res, next) => {
        const sanitizedData = sanitizeUpdateFields(req.body);

        // Guard: prevent admin from demoting themselves
        if (
            req.params.id === req.user._id.toString() &&
            sanitizedData.role &&
            sanitizedData.role !== req.user.role
        ) {
            return next(errors.BAD_REQUEST);
        }

        // Note: findByIdAndUpdate bypasses pre('save') hooks.
        // Never add 'password' to allowedFields in sanitizeUpdateFields
        // without switching to findById + save() to ensure hashing runs.
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            sanitizedData,
            { returnDocument: "after" },
        );
        if (!updatedUser) return next(errors.NOT_FOUND);

        res.json(updatedUser.getProfile());
    },

    deleteUser: async (req, res, next) => {
        // Guard: prevent admin from deleting themselves
        if (req.params.id === req.user._id.toString()) {
            return next(errors.BAD_REQUEST);
        }

        const result = await User.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) return next(errors.NOT_FOUND);
        res.json(result);
    },
};
