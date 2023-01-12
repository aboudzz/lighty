var path = require('path')
var config = require('config')
var logger = require('morgan')
var express = require('express')
var mongoose = require('mongoose')
var passport = require('passport')
var dateFormat = require('dateformat')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')

var routes = require('./routes/index')
var errors = require('./utils/errors')
var jwtStrategy = require('./utils/jwtStrategy')

global.Promise = require('bluebird')

mongoose.Promise = global.Promise
mongoose.connect(config.get('mongodb.URI'))
mongoose.connection.on('connected', () => {
    console.info('Connected to database ' + config.get('mongodb.URI'))
})
mongoose.connection.on('error', (err) => {
    let dbURI = config.get('mongodb.URI')
    console.error(`Database '${dbURI}' connection error: ${err}`)
    process.exit(1)
})

passport.initialize()
passport.use(jwtStrategy)

var app = express()

// patch console-stamp datetime format to morgan logger
logger.format('date', () => dateFormat(new Date(), config.get('datetime.format')))
app.use(logger('[:date] [:method]  :url :status :res[content-length] - :remote-addr - :response-time ms'))
app.use(cookieParser())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.use(routes)
app.use(errors.error404)
app.use(errors.handler)

module.exports = app
