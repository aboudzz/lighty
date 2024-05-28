const User = require('../models/User');

module.exports = {
    getUsers: async (req, res, next) => {
        try {
            if (req.params.id) {
                const user = await User.findById(req.params.id);
                res.json(user.getProfile());
            } else {
                const findQuery = {};
                if (req.query.search) {
                    const regexp = new RegExp(req.query.search, 'i');
                    findQuery.$or = [{ name: regexp }, { email: regexp }];
                }
                const sortQuery = req.query.sort ? { [req.query.sort]: 1 } : { updatedAt: 1 };

                const dataCursor = User.find(findQuery)
                    .sort(sortQuery)
                    .limit(parseInt(req.query.limit))
                    .skip(parseInt(req.query.skip))
                    .select(['-password', '-confirmationInfo', '-resetPasswordInfo'])
                    .exec();

                const countCursor = User.find(findQuery).count();

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
