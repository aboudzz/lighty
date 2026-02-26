const User = require("../models/User");

const { getUser } = require("./users");
const errors = require("../utils/errors");
const { escapeRegExp } = require("../utils/helpers");
const {
    validateEmail,
    validateName,
    validateRole,
    validateConfirmed,
    validateObjectId,
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

    if ("name" in body) {
        sanitized.name = validateName(body.name);
    }

    if ("email" in body) {
        sanitized.email = validateEmail(body.email);
    }

    if ("role" in body) {
        sanitized.role = validateRole(body.role);
    }

    if ("confirmed" in body) {
        sanitized.confirmed = validateConfirmed(body.confirmed);
    }

    return sanitized;
};

module.exports = {
    getUser,

    listUsers: async (req, res, _next) => {
        const findQuery = {};
        if (req.query.search) {
            const search = String(req.query.search).slice(0, 200);
            const regexp = new RegExp(escapeRegExp(search), "i");
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
        const id = validateObjectId(req.params.id);
        const sanitizedData = sanitizeUpdateFields(req.body);

        // Guard: prevent admin from demoting themselves
        if (
            id === req.user._id.toString() &&
            sanitizedData.role &&
            sanitizedData.role !== req.user.role
        ) {
            return next(errors.BAD_REQUEST);
        }

        if (sanitizedData.email) {
            const existing = await User.findOne({ email: sanitizedData.email });
            if (existing && existing._id.toString() !== id) {
                return next(errors.EMAIL_ALREADY_REGISTERED);
            }
        }

        // Note: findByIdAndUpdate bypasses pre('save') hooks.
        // Never add 'password' to allowedFields in sanitizeUpdateFields
        // without switching to findById + save() to ensure hashing runs.
        const updatedUser = await User.findByIdAndUpdate(
            String(id),
            sanitizedData,
            { returnDocument: "after" },
        );
        if (!updatedUser) return next(errors.NOT_FOUND);

        res.json(updatedUser.getProfile());
    },

    deleteUser: async (req, res, next) => {
        const id = validateObjectId(req.params.id);
        // Guard: prevent admin from deleting themselves
        if (id === req.user._id.toString()) {
            return next(errors.BAD_REQUEST);
        }

        const result = await User.deleteOne({ _id: String(id) });
        if (result.deletedCount === 0) return next(errors.NOT_FOUND);
        res.json(result);
    },
};
