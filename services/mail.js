const ejs = require('ejs');
const path = require('node:path');
const config = require('config');
const nodemailer = require('nodemailer');
const debug = require('debug')('debug:mail');

const service = config.get('mail.service');
const port = config.get('mail.port');
const secure = config.get('mail.secure');
const sender = config.get('mail.sender');
const tlsOptions = {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
};

// verify mail server connection
const transporter = nodemailer.createTransport({
    host: service,
    port: port,
    secure: secure,
    tls: tlsOptions
});

transporter.verify((error, success) => {
    if (error) {
        console.error('Mail server connection failed:', error.message);
        debug('Mail server connection error details:', error);
    } else {
        if (!sender) {
            console.warn('WARNING: Mail sender address not configured. Email functionality will be limited.');
        }
        if (!process.env[config.get('mail.sender_password_env')] && process.env.NODE_ENV !== 'test') {
            console.warn(`WARNING: ${config.get('mail.sender_password_env')} environment variable not set. Email functionality will be limited.`);
        }
    }
});

let authTransporter = null;

const getAuthTransporter = () => {
    const pass = process.env[config.get('mail.sender_password_env')];
    if (!pass) {
        throw new Error('MAIL_SENDER_PASSWORD not configured. Cannot send email.');
    }
    if (!authTransporter) {
        authTransporter = nodemailer.createTransport({
            host: service,
            port: port,
            secure: secure,
            auth: { user: sender, pass: pass },
            tls: tlsOptions
        });
    }
    return authTransporter;
};

const send = (to, subject, text, html) => {
    let transport;
    try {
        transport = getAuthTransporter();
    } catch (err) {
        debug('Email send failed:', err.message);
        return Promise.reject(err);
    }

    return transport.sendMail({ from: sender, to, subject, text, html })
        .then(info => {
            debug('Email sent successfully:', info.messageId);
            return info;
        })
        .catch(err => {
            console.error('Failed to send email:', err.message);
            debug('Email error details:', err);
            throw err;
        });
};

const mailer = {

    sendConfirmation: user => {
        const subject = 'Confirmation Email';
        const to = user.email;
        const name = user.name;
        const lookup = user.confirmationInfo.lookup;
        const verify = user.confirmationInfo.verify;
        const URL = user.confirmationInfo.URL;
        const link = `${URL}?l=${lookup}&v=${verify}`;
        debug('Confirmation link generated for:', to);
        const textFile = path.join(__dirname, '../resources/emails/confirm_text.ejs');
        
        return ejs.renderFile(textFile, { name, link })
            .then(text => send(to, subject, text, null))
            .catch(err => {
                console.error('Failed to render or send confirmation email:', err.message);
                throw err;
            });
    },

    sendResetPassword: user => {
        const subject = 'Reset Password';
        const to = user.email;
        const name = user.name;
        const lookup = user.resetPasswordInfo.lookup;
        const verify = user.resetPasswordInfo.verify;
        const URL = user.resetPasswordInfo.URL;
        const link = `${URL}?l=${lookup}&v=${verify}`;
        debug('Reset password link generated for:', to);
        const textFile = path.join(__dirname, '../resources/emails/resetPassword_text.ejs');
        
        return ejs.renderFile(textFile, { name, link })
            .then(text => send(to, subject, text, null))
            .catch(err => {
                console.error('Failed to render or send reset password email:', err.message);
                throw err;
            });
    }
};

module.exports = mailer;
