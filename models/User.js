var mongoose = require('mongoose')

const roles = ['admin', 'user']

const UserSchema = mongoose.Schema({
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
})

UserSchema.methods.getProfile = function () {
    let profile = this.toObject()
    delete profile.password
    delete profile.confirmationInfo
    delete profile.resetPasswordInfo
    return profile
}

const User = module.exports = mongoose.model('User', UserSchema)