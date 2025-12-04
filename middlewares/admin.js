const User = require('../models/User');

const errors = require('../utils/errors');
const { validateEmail, validateName, validateRole, validateConfirmed } = require('../utils/validation');

const escapeRegExp = regex => regex.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

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
    getUsers: async (req, res, next) => {
        try {
            if (req.params.id) {
                const user = await User.findById(req.params.id);
                if (!user) return next(errors.NOT_FOUND);
                res.json(user.getProfile());
            } else {
                const findQuery = {};
                if (req.query.search) {
                    const regexp = new RegExp(escapeRegExp(req.query.search), 'i');
                    findQuery.$or = [{ name: regexp }, { email: regexp }];
                }
                const sortQuery = req.query.sort ? { [req.query.sort]: 1 } : { updatedAt: 1 };

                const dataCursor = User.find(findQuery)
                    .sort(sortQuery)
                    .limit(Number.parseInt(req.query.limit))
                    .skip(Number.parseInt(req.query.skip))
                    .select(['-password', '-confirmationInfo', '-resetPasswordInfo'])
                    .exec();

                const countCursor = User.find(findQuery).countDocuments();

                const [data, count] = await Promise.all([dataCursor, countCursor]);
                for (const d of data) {
                    delete d.password;
                }
                res.json({ data, count });
            }
        } catch (error) {
            next(error);
        }
    },

    updateUser: async (req, res, next) => {
        try {
            const sanitizedData = sanitizeUpdateFields(req.body);
            
            const updatedUser = await User.findByIdAndUpdate(req.params.id, sanitizedData, { new: true });
            if (!updatedUser) return next(errors.NOT_FOUND);
            
            res.json(updatedUser.getProfile());
        } catch (error) {
            next(error);
        }
    },

    deleteUser: async (req, res, next) => {
        try {
            const result = await User.deleteOne({ _id: req.params.id });
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
};
