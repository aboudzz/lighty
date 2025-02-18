const passportJwt = require('passport-jwt');
const config = require('config');
const debug = require('debug')('debug:jwt');

const errors = require('./errors');
const User = require('../models/User');

const { ExtractJwt, Strategy: JwtStrategy } = passportJwt;

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    secretOrKey: config.get("passport.secret"),
};

const jwtStrategy = new JwtStrategy(jwtOptions, async (payload, next) => {
    try {
        const user = await User.findById(payload.sub);
        next(null, user || false);
    } catch (err) {
        next(err);
    }
});

module.exports = jwtStrategy;
