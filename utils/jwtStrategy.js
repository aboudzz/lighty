const passportJwt = require('passport-jwt');
const config = require('config');
const debug = require('debug')('debug:jwt');

const errors = require('./errors');
const User = require('../models/User');

const { ExtractJwt, Strategy: JwtStrategy } = passportJwt;

// JWT Secret must come from environment variable
const jwtSecret = process.env[config.get('jwt.secret_env')];

if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET environment variable is required!');
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    }
}

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    secretOrKey: jwtSecret,
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
