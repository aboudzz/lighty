const config = require("config");
const logger = require("./logger").child({ module: "initAdmin" });
const { validatePassword } = require("./validation");
const User = require("../models/User");

const initAdmin = async () => {
    const adminEmail = config.get("admin.email");
    const adminPassword = process.env[config.get("admin.password_env")];

    try {
        const adminUser = await User.findOne({ email: adminEmail });
        if (!adminUser) {
            if (!adminPassword) {
                logger.warn(
                    "%s environment variable not set. Admin user will not be created.",
                    config.get("admin.password_env"),
                );
                return;
            }
            try {
                validatePassword(adminPassword);
            } catch {
                logger.error(
                    "Admin password does not meet strength requirements. Admin user will not be created.",
                );
                return;
            }
            logger.debug("Creating admin user");
            try {
                await User.create({
                    name: "Admin",
                    email: adminEmail,
                    password: adminPassword,
                    confirmed: true,
                    role: "admin",
                });
            } catch (err) {
                logger.error({ err }, "Failed to create admin user");
            }
        }
    } catch (err) {
        logger.error({ err }, "Error checking for admin user");
    }
};

module.exports = initAdmin;
