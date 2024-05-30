const config = require('config');
const bcrypt = require('bcryptjs');
const shortId = require('shortid');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const User = require('../models/User');
const errors = require('../utils/errors');
const mailService = require('../services/mail');

const host = config.get('server.host');
const port = config.get('server.port') !== '80' ? ':' + config.get('server.port') : '';

const throwBadRequest = () => { throw errors.BAD_REQUEST; };

const validateEmail = email => validator.isEmail(email) || throwBadRequest();

module.exports = {
    getUser: async (req, res, next) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) next(errors.NOT_FOUND);
            res.json(user.getProfile());
        } catch (error) {
            next(error);
        }
    },

    register: async (req, res, next) => {
        try {
            validateEmail(req.body.email)
            const any = await User.findOne({ email: req.body.email });
            if (any) throw errors.EMAIL_ALREADY_REGISTERED;
            const hash = await bcrypt.hash(req.body.password, 10);
            const user = await User.create({
                name: req.body.name,
                email: req.body.email,
                password: hash,
                confirmationInfo: {
                    lookup: shortId.generate(),
                    verify: shortId.generate(),
                    URL: req.body.URL || `http://${host}${port}/users/confirm`
                }
            });
            mailService.sendConfirmation(user);
            res.json(user.getProfile());
        } catch (error) {
            next(error);
        }
    },

    confirm: async (req, res, next) => {
        try {
            const lookup = validator.escape(req.query.l);
            const verify = req.query.v;
            const user = await User.findOne({ 'confirmationInfo.lookup': lookup });
            if (!user || user.confirmationInfo.verify !== verify) throw errors.BAD_REQUEST;
            user.confirmationInfo = undefined;
            user.confirmed = true;
            await user.save();
            res.json(user.getProfile());
        } catch (error) {
            next(error);
        }
    },

    authenticate: async (req, res, next) => {
        try {
            if (req.body.email != 'admin') {
                validateEmail(req.body.email)
            }
            const user = await User.findOne({ email: req.body.email });
            if (!user) throw errors.EMAIL_NOT_REGISTERED;
            const match = await bcrypt.compare(req.body.password || "", user.password);
            if (!match) throw errors.INCORRECT_PASSWORD;
            const payload = { sub: user._id };
            const token = jwt.sign(payload, config.get('passport.secret'));
            const profile = user.getProfile();
            profile.token = token;
            res.json(profile);
        } catch (error) {
            next(error);
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            validateEmail(req.body.email)
            const user = await User.findOne({ email: req.body.email });
            if (user) {
                user.resetPasswordInfo = {
                    lookup: shortId.generate(),
                    verify: shortId.generate(),
                    expire: Date.now() + 3600000, // 1 hour
                    URL: req.body.URL || `http://${host}${port}/users/resetPassword`
                };
                mailService.sendResetPassword(user);
                await user.save();
            }
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const lookup = validator.escape(req.body.lookup);
            const verify = req.body.verify;
            const user = await User.findOne({ 'resetPasswordInfo.lookup': lookup });
            if (!user || user.resetPasswordInfo.verify !== verify) throw errors.BAD_REQUEST;
            if (user.resetPasswordInfo.expire < Date.now()) throw errors.LINK_EXPIRED;
            const hash = await bcrypt.hash(req.body.password, 10);
            user.password = hash;
            user.resetPasswordInfo = undefined;
            await user.save();
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    },

    updatePassword: async (req, res, next) => {
        try {
            const match = await bcrypt.compare(req.body.oldPassword, req.user.password);
            if (!match) throw errors.INCORRECT_PASSWORD;
            const hash = await bcrypt.hash(req.body.newPassword, 10);
            req.user.password = hash;
            await req.user.save();
            res.status(200).send();
        } catch (error) {
            next(error);
        }
    }
};
