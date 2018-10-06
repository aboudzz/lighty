var express = require('express')
var router = express.Router()

var users = require('./users')
var admin = require('./admin')

router.get('/ping', (req, res, next) => { res.send('pong') })

router.use('/users', users)

router.use('/admin', admin)

module.exports = router