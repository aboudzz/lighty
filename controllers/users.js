const config = require('config');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const User = require('../models/User');
const errors = require('../utils/errors');
const logger = require('../utils/logger').child({ module: 'users' });
const mailService = require('../services/mail');
const { validatePassword, validateEmail, validateName } = require('../utils/validation');

const appUrl = config.get('app.url');
const CONFIRMATION_EXPIRY_MS = 24 * 3600000; // 24 hours

const getJwtSecret = () => process.env[config.get('jwt.secret_env')];

module.exports = {
    getUser: async (req, res, next) => {
        const user = await User.findById(req.params.id);
        if (!user) return next(errors.NOT_FOUND);
        res.json(user.getProfile());
    },

    register: async (req, res, next) => {
        const name = validateName(req.body.name);
        const email = validateEmail(req.body.email);
        validatePassword(req.body.password);
        
        const any = await User.findOne({ email: email });
        if (any) return next(errors.EMAIL_ALREADY_REGISTERED);
        
        const user = await User.create({
            name: name,
            email: email,
            password: req.body.password,
            confirmationInfo: {
                lookup: nanoid(),
                verify: nanoid(),
                expire: Date.now() + CONFIRMATION_EXPIRY_MS,
                URL: `${appUrl}/users/confirm`
            }
        });
        mailService.sendConfirmation(user);
        res.status(201).json(user.getProfile());
    },

    confirm: async (req, res, next) => {
        const lookup = validator.escape(req.query.l);
        const verify = validator.escape(req.query.v);
        const user = await User.findOne({ 'confirmationInfo.lookup': lookup });
        if (!user || user.confirmationInfo.verify !== verify) return next(errors.BAD_REQUEST);
        if (user.confirmationInfo.expire && user.confirmationInfo.expire < Date.now()) return next(errors.LINK_EXPIRED);
        user.confirmationInfo = undefined;
        user.confirmed = true;
        await user.save();
        res.json(user.getProfile());
    },

    authenticate: async (req, res, next) => {
        const email = validateEmail(req.body.email);
        const user = await User.findOne({ email: email });
        if (!user) return next(errors.INVALID_CREDENTIALS);
        const match = await bcrypt.compare(req.body.password || "", user.password);
        if (!match) return next(errors.INVALID_CREDENTIALS);
        const payload = { sub: user._id };
        const token = jwt.sign(payload, getJwtSecret(), { expiresIn: config.get('jwt.expiresIn') });
        const profile = user.getProfile();
        profile.token = token;
        res.json(profile);
    },

    forgotPassword: async (req, res, next) => {
        const email = validateEmail(req.body.email);
        const user = await User.findOne({ email: email });
        if (user) {
            user.resetPasswordInfo = {
                lookup: nanoid(),
                verify: nanoid(),
                expire: Date.now() + 3600000, // 1 hour
                URL: `${appUrl}/users/resetPassword`
            };
            try {
                await mailService.sendResetPassword(user);
            } catch (mailError) {
                logger.error({ err: mailError }, 'Failed to send reset password email for %s', email);
            }
            await user.save();
        }
        res.status(200).send();
    },

    resetPassword: async (req, res, next) => {
        const lookup = validator.escape(req.body.lookup);
        const verify = validator.escape(req.body.verify);
        validatePassword(req.body.password);
        
        const user = await User.findOne({ 'resetPasswordInfo.lookup': lookup });
        if (!user || !user.resetPasswordInfo || user.resetPasswordInfo.verify !== verify) return next(errors.BAD_REQUEST);
        if (user.resetPasswordInfo.expire < Date.now()) return next(errors.LINK_EXPIRED);
        
        user.password = req.body.password;
        user.resetPasswordInfo = undefined;
        await user.save();
        res.status(200).send();
    },

    updatePassword: async (req, res, next) => {
        if (!req.user) return next(errors.UNAUTHORIZED);
        const match = await bcrypt.compare(req.body.oldPassword, req.user.password);
        if (!match) return next(errors.INCORRECT_PASSWORD);
        
        validatePassword(req.body.newPassword);
        
        req.user.password = req.body.newPassword;
        await req.user.save();
        res.status(200).send();
    }
};
