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
            Object.keys(req.body).forEach(field => allowedFields.includes(field) || throwBadRequest());

            if (req.body.name) {
                req.body.name = validator.escape(validator.trim(req.body.name));
            }

            if (req.body.email) {
                validateEmail(req.body.email);
            }

            if (req.body.role) {
                req.body.role = validator.escape(validator.trim(req.body.role));
            }

            if (req.body.confirmed) {
                validateBoolean(req.body.confirmed);
            }

            delete req.body.password;
            delete req.body.confirmationInfo;
            delete req.body.resetPasswordInfo;

            const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
