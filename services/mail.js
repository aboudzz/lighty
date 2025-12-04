const ejs = require('ejs');
const path = require('path');
const config = require('config');
const nodemailer = require('nodemailer');
const debug = require('debug')('debug:mail');

const service = config.get('mail.service');
const sender = config.get('mail.sender');
const pass = process.env[config.get('mail.sender_password_env')];

if (!pass && process.env.NODE_ENV !== 'test') {
    console.warn('WARNING: MAIL_SENDER_PASSWORD environment variable not set. Email functionality will be limited.');
}

const send = (to, subject, text, html) => {
    if (!pass) {
        const error = new Error('MAIL_SENDER_PASSWORD not configured. Cannot send email.');
        debug('Email send failed:', error.message);
        return Promise.reject(error);
    }

    const transporter = nodemailer.createTransport({
        host: service,
        port: 587,
        secure: false,
        auth: { user: sender, pass: pass },
        tls: {
            rejectUnauthorized: false
        }
    });

    return transporter.sendMail({ from: sender, to, subject, text, html })
        .then(info => {
            debug('Email sent successfully:', info.messageId);
            return info;
        })
        .catch(err => {
            console.error('Failed to send email:', err.message);
            debug('Email error details:', err);
            throw err;
        })
        .finally(() => transporter.close());
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
