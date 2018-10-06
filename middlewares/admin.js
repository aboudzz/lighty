var User = require('../models/User')

module.exports = {
    getUsers: (req, res, next) => {
        if (req.params.id) {
            User.findById(req.params.id).then((user) => res.json(user.getProfile())).catch(next)
        }
        let findQuery = {}
        if (req.query.search) {
            let regexp = RegExp(req.query.search, 'i')
            findQuery.$or = [{ name: regexp }, { email: regexp }]
        }
        let sortQuery = {}
        if (req.query.sort) {
            sortQuery[req.query.sort] = 1
        }
        sortQuery['updatedAt'] = 1

        let dataCursor = User.find(findQuery)
            .sort(sortQuery)
            .limit(parseInt(req.query.limit))
            .skip(parseInt(req.query.skip))
            .select(['-password', '-confirmationInfo', '-resetPasswordInfo'])
            .exec()
        let countCursor = User.find(findQuery).count()
        Promise.props({
            data: dataCursor.then((data) => { data.forEach((d) => delete d.password); return data }),
            count: countCursor.then((count) => { return count })
        }).then((results) => res.json(results)).catch(next)
    },

    updateUser: (req, res, next) => {
        delete req.body.password, req.body.confirmationInfo, req.body.resetPasswordInfo
        User.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .then((user) => res.json(user.getProfile())).catch(next)
    },

    deleteUser: (req, res, next) => {
        User.remove({ _id: req.params.id }).then((results) => res.json(results)).catch(next)
    }
}