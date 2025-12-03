const validator = require('validator');

const User = require('../models/User');

const errors = require('../utils/errors');

const throwBadRequest = () => { throw errors.BAD_REQUEST; };

const escapeRegExp = regex => regex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const validateEmail = email => validator.isEmail(email) || throwBadRequest();

const validateBoolean = bool => typeof bool == 'boolean' || validator.isBoolean(bool) || throwBadRequest();

module.exports = {
    getUsers: async (req, res, next) => {
        try {
            if (req.params.id) {
                const user = await User.findById(req.params.id);
                if (!user) next(errors.NOT_FOUND);
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
                    .limit(parseInt(req.query.limit))
                    .skip(parseInt(req.query.skip))
                    .select(['-password', '-confirmationInfo', '-resetPasswordInfo'])
                    .exec();

                const countCursor = User.find(findQuery).countDocuments();

                const [data, count] = await Promise.all([dataCursor, countCursor]);
                data.forEach((d) => delete d.password);
                res.json({ data, count });
            }
        } catch (error) {
            next(error);
        }
    },

    updateUser: async (req, res, next) => {
        try {
            const allowedFields = ['name', 'email', 'role', 'confirmed']
            
            if (!req.body || typeof req.body !== 'object') {
                throwBadRequest();
            }
            
            Object.keys(req.body).forEach(field => allowedFields.includes(field) || throwBadRequest());

            if (req.body.name) {
                if (typeof req.body.name !== "string") throwBadRequest();
                req.body.name = validator.escape(validator.trim(req.body.name));
            }

            if (req.body.email) {
                if (typeof req.body.email !== "string") throwBadRequest();
                validateEmail(req.body.email);
            }

            if (req.body.role) {
                if (typeof req.body.role !== "string") throwBadRequest();
                req.body.role = validator.escape(validator.trim(req.body.role));
            }

            if ("confirmed" in req.body) {
                // Accept either boolean type or boolean string
                if (!(typeof req.body.confirmed === "boolean" || (typeof req.body.confirmed === "string" && validator.isBoolean(req.body.confirmed)))) throwBadRequest();
                req.body.confirmed = (typeof req.body.confirmed === "boolean") ? req.body.confirmed : validator.toBoolean(req.body.confirmed);
            }

            delete req.body.password;
            delete req.body.confirmationInfo;
            delete req.body.resetPasswordInfo;

            const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedUser) next(errors.NOT_FOUND);
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
