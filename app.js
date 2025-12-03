require('dotenv').config();
const path = require('path');
const config = require('config');
const logger = require('morgan');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const dateFormat = require('dateformat');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const routes = require('./routes/index');
const errors = require('./utils/errors');
const jwtStrategy = require('./utils/jwtStrategy');

global.Promise = require('bluebird');

mongoose.Promise = global.Promise;
mongoose.set('strictQuery', false);

// Validate critical environment variables
if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
        console.error('CRITICAL: JWT_SECRET environment variable must be set with at least 32 characters in production!');
        process.exit(1);
    }
}

// Only connect to database if not in test mode and if not already connected
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGODB_URI || config.get('mongodb.URI');
    mongoose.connect(mongoUri);
}

/* istanbul ignore next */
mongoose.connection.on('connected', () => {
    console.info(`Connected to database ${config.get('mongodb.URI')}`);
});
/* istanbul ignore next */
mongoose.connection.on('error', (err) => {
    const dbURI = config.get('mongodb.URI');
    console.error(`Database '${dbURI}' connection error: ${err}`);
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    }
});

passport.initialize();
passport.use(jwtStrategy);

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Global rate limiting
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || config.get('rateLimit.windowMs');
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || config.get('rateLimit.max');

const limiter = rateLimit({
    windowMs: windowMs,
    max: maxRequests,
    message: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// patch console-stamp datetime format to morgan logger
logger.format('date', () => dateFormat(new Date(), config.get('datetime.format')));
app.use(logger('[:date] [:method]  :url :status :res[content-length] - :remote-addr - :response-time ms'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);
app.use(errors.error404);
app.use(errors.handler);

module.exports = app;
