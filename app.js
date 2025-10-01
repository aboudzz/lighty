const path = require('path');
const config = require('config');
const logger = require('morgan');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const dateFormat = require('dateformat');
const cookieParser = require('cookie-parser');

const routes = require('./routes/index');
const errors = require('./utils/errors');
const jwtStrategy = require('./utils/jwtStrategy');

global.Promise = require('bluebird');

mongoose.Promise = global.Promise;
mongoose.set('strictQuery', false);

// Only connect to database if not in test mode or if not already connected
if (process.env.NODE_ENV !== 'test' || mongoose.connection.readyState === 0) {
    mongoose.connect(config.get('mongodb.URI'));
}

mongoose.connection.on('connected', () => {
    console.info(`Connected to database ${config.get('mongodb.URI')}`);
});
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
