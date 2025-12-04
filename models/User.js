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
    const config = require('config');
    const adminEmail = config.get('admin.email');
    const adminPassword = process.env[config.get('admin.password_env')];
    
    User.findOne({ email: adminEmail }).then(adminUser => {
        if (!adminUser) {
            if (!adminPassword) {
                console.warn('WARNING: ADMIN_PASSWORD environment variable not set. Admin user will not be created.');
                console.warn('Set ADMIN_PASSWORD environment variable to create admin user on startup.');
                return;
            }
            bcrypt.hash(adminPassword, 10).then(hash => {
                debug('Creating admin user');
                User.create({
                    name: 'Admin',
                    email: adminEmail,
                    password: hash,
                    confirmed: true,
                    role: 'admin'
                }).catch(err => {
                    console.error('Failed to create admin user:', err.message);
                });
            });
        }
    }).catch(err => {
        debug('Error checking for admin user:', err.message);
    });
});
