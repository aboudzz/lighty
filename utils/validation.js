const validator = require('validator');
const errors = require('./errors');

/**
 * Password validation requirements
 */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
    minLength: PASSWORD_MIN_LENGTH,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0
};

/**
 * Validates password strength
 * @param {string} password - The password to validate
 * @throws {Error} If password doesn't meet requirements
 */
const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        throw errors.BAD_REQUEST;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        const error = new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
        error.status = 400;
        error.code = 'WEAK_PASSWORD';
        throw error;
    }

    if (!validator.isStrongPassword(password, PASSWORD_REQUIREMENTS)) {
        const error = new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
        error.status = 400;
        error.code = 'WEAK_PASSWORD';
        throw error;
    }

    return true;
};

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @throws {Error} If email is invalid
 */
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        throw errors.BAD_REQUEST;
    }

    if (!validator.isEmail(email)) {
        throw errors.BAD_REQUEST;
    }

    return email;
};

/**
 * Sanitizes and validates user name
 * @param {string} name - The name to validate
 * @returns {string} Sanitized name
 */
const validateName = (name) => {
    if (!name || typeof name !== 'string') {
        throw errors.BAD_REQUEST;
    }

    const sanitized = validator.trim(name);
    
    if (sanitized.length < 1 || sanitized.length > 100) {
        throw errors.BAD_REQUEST;
    }

    return validator.escape(sanitized);
};

/**
 * Validates and sanitizes role field
 * @param {string} role - The role to validate
 * @returns {string} Sanitized role
 */
const ALLOWED_ROLES = ['admin', 'user'];

const validateRole = (role) => {
    if (!role || typeof role !== 'string') {
        throw errors.BAD_REQUEST;
    }
    const sanitized = validator.trim(role);
    if (!ALLOWED_ROLES.includes(sanitized)) {
        throw errors.BAD_REQUEST;
    }
    return sanitized;
};

/**
 * Validates and converts confirmed field (boolean or boolean string)
 * @param {boolean|string} confirmed - The confirmed value to validate
 * @returns {boolean} Boolean value
 */
const validateConfirmed = (confirmed) => {
    if (!(typeof confirmed === 'boolean' || (typeof confirmed === 'string' && validator.isBoolean(confirmed)))) {
        throw errors.BAD_REQUEST;
    }
    return typeof confirmed === 'boolean' ? confirmed : validator.toBoolean(confirmed);
};

module.exports = {
    validatePassword,
    validateEmail,
    validateName,
    validateRole,
    validateConfirmed,
    PASSWORD_MIN_LENGTH
};
