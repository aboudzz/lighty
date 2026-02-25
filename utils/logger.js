const pino = require('pino');

const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    enabled: !isTest,
    formatters: {
        level(label) {
            return { level: label };
        }
    }
});

module.exports = logger;
