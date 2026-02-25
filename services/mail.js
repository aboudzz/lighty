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
        const pass = process.env[config.get("mail.sender_password_env")];
        if (!pass) {
            throw new Error(
                "MAIL_SENDER_PASSWORD not configured. Cannot send email.",
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
    const transporter = nodemailer.createTransport({
        host: service,
        port: port,
        secure: secure,
        tls: tlsOptions,
    });
    transporter.verify((error) => {
        if (error) {
            logger.error({ error }, "Mail server connection failed");
        } else {
            if (!sender) {
                logger.warn(
                    "Mail sender address not configured. Email functionality will be limited.",
                );
            }
            if (
                !process.env[config.get("mail.sender_password_env")] &&
                process.env.NODE_ENV !== "test"
            ) {
                logger.warn(
                    "%s environment variable not set. Email functionality will be limited.",
                    config.get("mail.sender_password_env"),
                );
            }
        }
    });
};

// Verify on first use, not at import time
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
