const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        expire: Date,
        URL: String
    },
    resetPasswordInfo: {
        lookup: String,
        verify: String,
        expire: Date,
        URL: String
    }
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

UserSchema.methods.getProfile = function () {
    const profile = this.toObject();
    profile._id = profile._id.toString();
    delete profile.password;
    delete profile.confirmationInfo;
    delete profile.resetPasswordInfo;
    delete profile.__v;
    return profile;
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
