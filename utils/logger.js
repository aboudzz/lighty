const pino = require('pino');

const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    enabled: !isTest,
    ...(!isProduction && !isTest && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:ddd mmm dd yyyy HH:MM:ss.l',
                ignore: 'pid,hostname,module',
                messageFormat: '{msg}'
            }
        }
    }),
    formatters: {
        level(label) {
            return { level: label };
        }
    }
});

module.exports = logger;
