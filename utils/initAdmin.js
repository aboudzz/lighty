const config = require('config');
const debug = require('debug')('debug:initAdmin');
const { validatePassword } = require('./validation');
const User = require('../models/User');

const initAdmin = () => {
    const adminEmail = config.get('admin.email');
    const adminPassword = process.env[config.get('admin.password_env')];
    
    User.findOne({ email: adminEmail }).then(adminUser => {
        if (!adminUser) {
            if (!adminPassword) {
                console.warn(`WARNING: ${config.get('admin.password_env')} environment variable not set. Admin user will not be created.`);
                console.warn('Set ADMIN_PASSWORD environment variable to create admin user on startup.');
                return;
            }
            try {
                validatePassword(adminPassword);
            } catch {
                console.error('Admin password does not meet strength requirements (8+ chars, uppercase, lowercase, number). Admin user will not be created.');
                return;
            }
            debug('Creating admin user');
            User.create({
                name: 'Admin',
                email: adminEmail,
                password: adminPassword,
                confirmed: true,
                role: 'admin'
            }).catch(err => {
                console.error('Failed to create admin user:', err.message);
            });
        }
    }).catch(err => {
        debug('Error checking for admin user:', err.message);
    });
};

module.exports = initAdmin;
