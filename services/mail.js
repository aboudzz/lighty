const ejs = require('ejs');
const path = require('node:path');
const config = require('config');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger').child({ module: 'mail' });

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
        logger.error({ error }, 'Mail server connection failed');
    } else {
        if (!sender) {
            logger.warn('Mail sender address not configured. Email functionality will be limited.');
        }
        if (!process.env[config.get('mail.sender_password_env')] && process.env.NODE_ENV !== 'test') {
            logger.warn('%s environment variable not set. Email functionality will be limited.', config.get('mail.sender_password_env'));
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
        logger.debug('Email send failed: %s', err.message);
        return Promise.reject(err);
    }

    return transport.sendMail({ from: sender, to, subject, text, html })
        .then(info => {
            logger.debug('Email sent successfully: %s', info.messageId);
            return info;
        })
        .catch(err => {
            logger.error({ err }, 'Failed to send email');
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
        logger.debug('Confirmation link generated for: %s', to);
        const textFile = path.join(__dirname, '../resources/emails/confirm_text.ejs');
        
        return ejs.renderFile(textFile, { name, link })
            .then(text => send(to, subject, text, null))
            .catch(err => {
                logger.error({ err }, 'Failed to render or send confirmation email');
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
        logger.debug('Reset password link generated for: %s', to);
        const textFile = path.join(__dirname, '../resources/emails/resetPassword_text.ejs');
        
        return ejs.renderFile(textFile, { name, link })
            .then(text => send(to, subject, text, null))
            .catch(err => {
                logger.error({ err }, 'Failed to render or send reset password email');
                throw err;
            });
    }
};

module.exports = mailer;
