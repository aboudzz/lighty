const ejs = require('ejs');
const path = require('path');
const config = require('config');
const nodemailer = require('nodemailer');
const debug = require('debug')('debug:mail');

const sender = config.get('mail.from');

const send = (from, to, subject, text, html) => {
    const transporter = nodemailer.createTransport({
        service: 'SERVICE',
        auth: { user: 'MAIL', pass: 'PASS' }
    });
    transporter.sendMail({from, to, subject, text, html})
    .then(info => debug(info))
    .catch(err => debug(err))
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
        debug(link);
        const textFile = path.join(__dirname, '../resources/emails/confirm_text.ejs');
        ejs.renderFile(textFile, { name, link }, (err, text) => {
            if (err) return debug(err);
            send(sender, to, subject, text, null);
        });
    },

    sendResetPassword: user => {
        const subject = 'Reset Password';
        const to = user.email;
        const name = user.name;
        const lookup = user.resetPasswordInfo.lookup;
        const verify = user.resetPasswordInfo.verify;
        const URL = user.confirmationInfo.URL;
        const link = `http://${URL}?l=${lookup}&v=${verify}`;
        debug(link);
        const textFile = path.join(__dirname, '../resources/emails/resetPassword_text.ejs');
        ejs.renderFile(textFile, { name, link }, (err, text) => {
            if (err) return debug(err);
            send(sender, to, subject, text, null);
        });
    }
};

module.exports = mailer;
