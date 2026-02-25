require('dotenv').config({ quiet: process.env.NODE_ENV === 'test' });
const path = require('node:path');
const config = require('config');
const pinoHttp = require('pino-http');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const logger = require('./utils/logger');
const routes = require('./routes/index');
const errors = require('./utils/errors');
const jwtStrategy = require('./utils/jwtStrategy');
const initAdmin = require('./utils/initAdmin');

mongoose.set('strictQuery', false);

// Validate critical environment variables
if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env[config.get('jwt.secret_env')];
    if (!jwtSecret || jwtSecret.length < 32) {
        console.error('CRITICAL: JWT_SECRET environment variable must be set with at least 32 characters in production!');
        process.exit(1);
    }
}

// Only connect to database if not in test mode and if not already connected
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGODB_URI || config.get('mongodb.uri');
    mongoose.connect(mongoUri);
}

/* istanbul ignore next */
mongoose.connection.on('connected', () => {
    logger.info('Connected to database');
    initAdmin();
});
/* istanbul ignore next */
mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'Database connection error');
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    }
});

passport.initialize();
passport.use(jwtStrategy);

const app = express();

// CORS configuration
const corsOrigins = config.get('cors.origins');

app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // 'unsafe-inline' is required for compatibility with Swagger UI and certain UI frameworks
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
const windowMs = config.get('rateLimit.windowMs');
const maxRequests = config.get('rateLimit.max');

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

app.use(pinoHttp({
    logger,
    autoLogging: process.env.NODE_ENV !== 'test',
    serializers: {
        req: () => undefined,
        res: () => undefined
    },
    customSuccessMessage(req, res, responseTime) {
        return `[${req.method}]  ${req.url} ${res.statusCode} ${res.getHeader('content-length') || '-'} - ${req.socket.remoteAddress} - ${responseTime} ms`;
    },
    customErrorMessage(req, res, error) {
        return `[${req.method}]  ${req.url} ${res.statusCode} - ${req.socket.remoteAddress} - ${error.message}`;
    }
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(routes);
app.use(errors.error404);
app.use(errors.handler);

module.exports = app;
