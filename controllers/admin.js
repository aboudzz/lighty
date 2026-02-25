const User = require('../models/User');

const errors = require('../utils/errors');
const { escapeRegExp } = require('../utils/helpers');
const { validateEmail, validateName, validateRole, validateConfirmed } = require('../utils/validation');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const ALLOWED_SORT_FIELDS = new Set(['name', 'email', 'role', 'confirmed', 'createdAt', 'updatedAt']);

const sanitizeUpdateFields = (body) => {
    const allowedFields = new Set(['name', 'email', 'role', 'confirmed']);
    
    if (!body || typeof body !== 'object') {
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

    listUsers: async (req, res, next) => {
        const findQuery = {};
        if (req.query.search) {
            const regexp = new RegExp(escapeRegExp(req.query.search), 'i');
            findQuery.$or = [{ name: regexp }, { email: regexp }];
        }

        const sortField = ALLOWED_SORT_FIELDS.has(req.query.sort) ? req.query.sort : 'updatedAt';
        const sortQuery = { [sortField]: 1 };
        const limit = Math.min(Math.max(1, Number.parseInt(req.query.limit, 10)) || DEFAULT_LIMIT, MAX_LIMIT);
        const skip = Math.max(0, Number.parseInt(req.query.skip, 10)) || 0;

        const dataCursor = User.find(findQuery)
            .sort(sortQuery)
            .limit(limit)
            .skip(skip)
            .select(['-password', '-confirmationInfo', '-resetPasswordInfo'])
            .exec();

        const countCursor = User.find(findQuery).countDocuments();

        const [data, count] = await Promise.all([dataCursor, countCursor]);
        res.json({ data, count });
    },

    updateUser: async (req, res, next) => {
        const sanitizedData = sanitizeUpdateFields(req.body);
        
        const updatedUser = await User.findByIdAndUpdate(req.params.id, sanitizedData, { returnDocument: 'after' });
        if (!updatedUser) return next(errors.NOT_FOUND);
        
        res.json(updatedUser.getProfile());
    },

    deleteUser: async (req, res, next) => {
        const result = await User.deleteOne({ _id: req.params.id });
        res.json(result);
    },
};
