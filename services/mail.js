const ejs = require("ejs");
const path = require("node:path");
const config = require("config");
const nodemailer = require("nodemailer");
const logger = require("../utils/logger").child({ module: "mail" });

const service = config.get("mail.service");
const port = config.get("mail.port");
const secure = config.get("mail.secure");
const sender = config.get("mail.sender");
const tlsOptions = {
    rejectUnauthorized: process.env.NODE_ENV === "production",
};

let verified = false;
let authTransporter = null;

const getTransporter = () => {
    if (!authTransporter) {
        const envVar = config.get("mail.sender_password_env");
        const pass = process.env[envVar];
        if (!pass) {
            throw new Error(
                `${envVar} not configured. Cannot send email.`,
            );
        }
        authTransporter = nodemailer.createTransport({
            host: service,
            port: port,
            secure: secure,
            auth: { user: sender, pass: pass },
            tls: tlsOptions,
        });
    }
    return authTransporter;
};

const verifyConnection = () => {
    if (verified) return;
    verified = true;
    try {
        const transporter = getTransporter();
        transporter.verify((error) => {
            if (error) {
                logger.error({ error }, "Mail server connection failed");
            }
        });
    } catch (err) {
        logger.warn({ err }, "Mail transporter not available for verification");
    }
};

// Verify mail server connectivity on startup (skipped in test)
if (process.env.NODE_ENV !== "test") {
    verifyConnection();
}

const send = (to, subject, text, html) => {
    const transport = getTransporter();
    return transport.sendMail({ from: sender, to, subject, text, html });
};

const mailer = {
    sendConfirmation: (user) => {
        const to = user.email;
        const name = user.name;
        const lookup = user.confirmationInfo.lookup;
        const verify = user.confirmationInfo.verify;
        const URL = user.confirmationInfo.URL;
        const link = `${URL}?l=${lookup}&v=${verify}`;
        logger.debug("Confirmation link generated for: %s", to);
        const textFile = path.join(
            __dirname,
            "../resources/emails/confirm_text.ejs",
        );
        const htmlFile = path.join(
            __dirname,
            "../resources/emails/confirm_html.ejs",
        );

        return Promise.all([
            ejs.renderFile(textFile, { name, link }),
            ejs.renderFile(htmlFile, { name, link }),
        ]).then(([text, html]) => send(to, "Confirmation Email", text, html));
    },

    sendResetPassword: (user) => {
        const to = user.email;
        const name = user.name;
        const lookup = user.resetPasswordInfo.lookup;
        const verify = user.resetPasswordInfo.verify;
        const URL = user.resetPasswordInfo.URL;
        const link = `${URL}?l=${lookup}&v=${verify}`;
        logger.debug("Reset password link generated for: %s", to);
        const textFile = path.join(
            __dirname,
            "../resources/emails/resetPassword_text.ejs",
        );
        const htmlFile = path.join(
            __dirname,
            "../resources/emails/resetPassword_html.ejs",
        );

        return Promise.all([
            ejs.renderFile(textFile, { name, link }),
            ejs.renderFile(htmlFile, { name, link }),
        ]).then(([text, html]) => send(to, "Reset Password", text, html));
    },
};

module.exports = mailer;
