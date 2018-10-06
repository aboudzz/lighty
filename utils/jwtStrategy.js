var passportJwt = require('passport-jwt')
var config = require('config')
var debug = require('debug')('debug:jwt')

var errors = require('./errors')
var User = require('../models/User')

var ExtractJwt = passportJwt.ExtractJwt
var JwtStrategy = passportJwt.Strategy

var jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey: config.get("passport.secret")
}

var jwtStrategy = module.exports = new JwtStrategy(jwtOptions, (payload, next) => {
    User.findById(payload.sub).then((user) => {
        if (user) next(null, user)
        else next(null, false)
    }).catch(next)
})
