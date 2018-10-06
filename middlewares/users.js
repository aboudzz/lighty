var config = require('config')
var bcrypt = require('bcryptjs')
var shortId = require('shortid')
var jwt = require('jsonwebtoken')

var User = require('../models/User')
var errors = require('../utils/errors')
var mailService = require('../services/mail')

const host = config.get('server.host')
const port = config.get('server.port') !== '80' ? ':' + config.get('server.port') : ''

module.exports = {
    getUser: (req, res, next) => {
        User.findById(req.params.id).then((user) => {
            if (!user) next(errors.NOT_FOUND)
            res.json(user.getProfile())
        }).catch(next)
    },

    register: (req, res, next) => {
        User.findOne({ email: req.body.email }).then((any) => {
            if (any) throw errors.EMAIL_ALREADY_REGISTERED
        }).then(() => {
            return bcrypt.hash(req.body.password, 10)
        }).then((hash) => {
            return User.create({
                name: req.body.name,
                email: req.body.email,
                password: hash,
                confirmationInfo: {
                    lookup: shortId.generate(),
                    verify: shortId.generate(),
                    URL: req.body.URL || `http://${host}${port}/users/confirm`
                }
            })
        }).then((user) => {
            mailService.sendConfirmation(user)
            res.json(user.getProfile())
        }).catch(next)
    },

    confirm: (req, res, next) => {
        let lookup = req.query.l
        let verify = req.query.v
        User.findOne({ 'confirmationInfo.lookup': lookup })
            .then((user) => {
                if (!user || user.confirmationInfo.verify !== verify) throw errors.BAD_REQUEST
                user.confirmationInfo = undefined
                user.confirmed = true
                return user.save()
            })
            .then((user) => {
                res.json(user.getProfile())
            }).catch(next)
    },

    authenticate: (req, res, next) => {
        let foundUser
        User.findOne({ email: req.body.email })
            .then((user) => {
                foundUser = user
                if (!user) throw errors.EMAIL_NOT_REGISTERED
                return bcrypt.compare(req.body.password || "", user.password)
            })
            .then((match) => {
                if (!match) throw errors.INCORRECT_PASSWORD
                let payload = { sub: foundUser._id }
                let token = jwt.sign(payload, config.get('passport.secret'))
                let profile = foundUser.getProfile()
                profile.token = token
                res.json(profile)
            }).catch(next)
    },

    forgotPassword: (req, res, next) => {
        User.findOne({ email: req.body.email })
            .then((user) => {
                if (user) {
                    user.resetPasswordInfo = {
                        lookup: shortId.generate(),
                        verify: shortId.generate(),
                        expire: Date.now() + 3600000, // 1 hour
                        URL: req.body.URL || `http://${host}${port}/users/resetPassword` // this won't work!
                    }
                    mailService.sendResetPassword(user)
                    return user.save()
                }
            })
            .then((any) => {
                res.status(200).send()
            }).catch(next)
    },

    resetPassword: (req, res, next) => {
        let lookup = req.body.lookup;
        let verify = req.body.verify;
        let foundUser
        User.findOne({ 'resetPasswordInfo.lookup': lookup })
            .then((user) => {
                foundUser = user
                if (!user || user.resetPasswordInfo.verify !== verify) throw errors.BAD_REQUEST
                if (user.resetPasswordInfo.expire < Date.now()) throw errors.LINK_EXPIRED
                return bcrypt.hash(req.body.password, 10)
            })
            .then((hash) => {
                foundUser.password = hash
                foundUser.resetPasswordInfo = undefined
                return foundUser.save()
            })
            .then((any) => {
                res.status(200).send()
            }).catch(next)
    },

    updatePassword: (req, res, next) => {
        bcrypt.compare(req.body.oldPassword, req.user.password)
            .then((match) => {
                if (!match) throw errors.INCORRECT_PASSWORD
                return bcrypt.hash(req.body.newPassword, 10)
            })
            .then((hash) => {
                req.user.password = hash
                return req.user.save()
            })
            .then((any) => {
                res.status(200).send()
            }).catch(next)
    }
}