const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const debug = require('debug')('debug:Users');

const roles = ['admin', 'user'];

/**
 * @openapi
 * components:
 *   schemas:
 *     UserProperties:
 *       type: object
 *       properties:
 *         name:  *userName
 *         email: *userEmail
 *         role:  *userRole
 *         confirmed: *userConfirmed
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:   *userId
 *         name:  *userName
 *         email: *userEmail
 *         role:  *userRole
 *         confirmed: *userConfirmed
 *     UserProfileWithToken:
 *       type: object
 *       properties:
 *         _id:   *userId
 *         name:  *userName
 *         email: *userEmail
 *         role:  *userRole
 *         confirmed: *userConfirmed
 *         token: *userToken
 */
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true },
    password: { type: String, required: true },
    confirmed: { type: Boolean, default: false },
    role: { type: String, enum: roles, default: 'user' },
    confirmationInfo: {
        lookup: String,
        verify: String,
        URL: String
    },
    resetPasswordInfo: {
        lookup: String,
        verify: String,
        expire: Date,
        URL: String
    }
});

UserSchema.methods.getProfile = function () {
    const profile = this.toObject();
    profile._id = profile._id.toString();
    delete profile.password;
    delete profile.confirmationInfo;
    delete profile.resetPasswordInfo;
    return profile;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;

mongoose.connection.on('connected', () => {
    // create admin user if not existed
    User.findOne({ email: 'admin' }).then(adminUser => {
        if (!adminUser) {
            bcrypt.hash('admin', 10).then(hash => {
                debug('create admin');
                const isProduction = process.env.NODE_ENV === 'production';
                User.create({
                    name: 'admin',
                    email: 'admin',
                    password: isProduction ? undefined : hash,
                    confirmed: true,
                    role: 'admin'
                });
            });
        }
    });
});
