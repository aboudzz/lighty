const crypto = require("node:crypto");
const config = require("config");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const timingSafeEqual = (a, b) => {
    if (typeof a !== "string" || typeof b !== "string") return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
};

const User = require("../models/User");
const errors = require("../utils/errors");
const logger = require("../utils/logger").child({ module: "users" });
const mailService = require("../services/mail");
const {
    validatePassword,
    validateEmail,
    validateName,
    validateObjectId,
} = require("../utils/validation");

const confirmationBaseUrl = config.get("app.confirmationBaseUrl");
const resetPasswordBaseUrl = config.get("app.resetPasswordBaseUrl");
const CONFIRMATION_EXPIRY_MS = 24 * 3600000; // 24 hours

const getJwtSecret = () => process.env[config.get("jwt.secret_env")];

module.exports = {
    getUser: async (req, res, next) => {
        const id = validateObjectId(req.params.id);
        const user = await User.findById(String(id));
        if (!user) return next(errors.NOT_FOUND);
        res.json(user.getProfile());
    },

    register: async (req, res, next) => {
        const name = validateName(req.body.name);
        const email = validateEmail(req.body.email);
        validatePassword(req.body.password);

        const any = await User.findOne({ email: String(email) });
        if (any) return next(errors.EMAIL_ALREADY_REGISTERED);

        const user = await User.create({
            name: name,
            email: String(email),
            password: String(req.body.password),
            confirmationInfo: {
                lookup: nanoid(),
                verify: nanoid(),
                expire: Date.now() + CONFIRMATION_EXPIRY_MS,
                URL: `${confirmationBaseUrl}/users/confirm`,
            },
        });
        mailService.sendConfirmation(user).catch((err) => {
            logger.error(
                { err, userId: user._id, email },
                "Failed to send confirmation email",
            );
        });
        res.status(201).json(user.getProfile());
    },

    confirm: async (req, res, next) => {
        const { l, v } = req.query;
        if (typeof l !== "string" || typeof v !== "string") {
            return next(errors.BAD_REQUEST);
        }
        const lookup = validator.escape(l);
        const verify = validator.escape(v);
        const user = await User.findOne({ "confirmationInfo.lookup": lookup });
        if (!user || !timingSafeEqual(user.confirmationInfo.verify, verify))
            return next(errors.BAD_REQUEST);
        if (
            user.confirmationInfo.expire &&
            user.confirmationInfo.expire < Date.now()
        )
            return next(errors.LINK_EXPIRED);
        user.confirmationInfo = undefined;
        user.confirmed = true;
        await user.save();
        res.json(user.getProfile());
    },

    authenticate: async (req, res, next) => {
        const email = validateEmail(req.body.email);
        const user = await User.findOne({ email: String(email) });
        if (!user) return next(errors.INVALID_CREDENTIALS);
        const match = await bcrypt.compare(
            req.body.password || "",
            user.password,
        );
        if (!match) return next(errors.INVALID_CREDENTIALS);
        if (!user.confirmed) return next(errors.UNAUTHORIZED);
        const payload = { sub: user._id };
        const token = jwt.sign(payload, getJwtSecret(), {
            expiresIn: config.get("jwt.expiresIn"),
        });
        const profile = user.getProfile();
        profile.token = token;
        res.json(profile);
    },

    forgotPassword: async (req, res, _next) => {
        const email = validateEmail(req.body.email);
        const user = await User.findOne({ email: String(email) });
        if (user) {
            user.resetPasswordInfo = {
                lookup: nanoid(),
                verify: nanoid(),
                expire: Date.now() + 3600000, // 1 hour
                URL: `${resetPasswordBaseUrl}/users/resetPassword`,
            };
            await user.save();
            try {
                await mailService.sendResetPassword(user);
            } catch (mailError) {
                logger.error(
                    { err: mailError, userId: user._id, email },
                    "Failed to send reset password email",
                );
            }
        }
        res.status(200).send();
    },

    resetPassword: async (req, res, next) => {
        const { lookup, verify, password } = req.body || {};

        if (
            typeof lookup !== "string" ||
            typeof verify !== "string" ||
            typeof password !== "string"
        ) {
            return next(errors.BAD_REQUEST);
        }

        const escapedLookup = validator.escape(lookup);
        const escapedVerify = validator.escape(verify);
        validatePassword(password);

        const user = await User.findOne({
            "resetPasswordInfo.lookup": escapedLookup,
        });
        if (
            !user ||
            !user.resetPasswordInfo ||
            !timingSafeEqual(user.resetPasswordInfo.verify, escapedVerify)
        )
            return next(errors.BAD_REQUEST);
        if (user.resetPasswordInfo.expire < Date.now())
            return next(errors.LINK_EXPIRED);

        user.password = password;
        user.resetPasswordInfo = undefined;
        await user.save();
        res.status(200).send();
    },

    updatePassword: async (req, res, next) => {
        if (!req.user) return next(errors.UNAUTHORIZED);
        if (!req.body.oldPassword || typeof req.body.oldPassword !== "string")
            return next(errors.BAD_REQUEST);
        const match = await bcrypt.compare(
            req.body.oldPassword,
            req.user.password,
        );
        if (!match) return next(errors.INCORRECT_PASSWORD);

        validatePassword(req.body.newPassword);

        req.user.password = req.body.newPassword;
        await req.user.save();
        res.status(200).send();
    },
};
