var ejs = require('ejs')
var path = require('path')
var config = require('config')
var nodemailer = require('nodemailer')
var debug = require('debug')('debug:mail')

const sender = config.get('mail.from')

const send = (from, to, subject, text, html) => {
    // let transporter = nodemailer.createTransport({
    //     service: 'SERVICE',
    //     auth: { user: 'MAIL', pass: 'PASS' }
    // })
    // transporter.sendMail({from, to, subject, text, html})
    // .then((info) => { debug(info)})
    // .catch((err) => { debug(err)})
    // .then(() => { transporter.close()})
}

var mailer = module.exports = {

    sendConfirmation: (user) => {
        let subject = 'Confirmation Email'
        let to = user.email
        let name = user.name
        let lookup = user.confirmationInfo.lookup
        let verify = user.confirmationInfo.verify
        let URL = user.confirmationInfo.URL
        let link = `${URL}?l=${lookup}&v=${verify}`
        debug(link)
        let textFile = path.join(__dirname, '../resources/emails/confirm_text.ejs')
        ejs.renderFile(textFile, { name, link }, (err, text) => {
            if (err) return debug(err)
            send(sender, to, subject, text, null)
        })
    },

    sendResetPassword: (user) => {
        let subject = 'Reset Password'
        let to = user.email
        let name = user.name
        let lookup = user.resetPasswordInfo.lookup
        let verify = user.resetPasswordInfo.verify
        let URL = user.confirmationInfo.URL
        let link = `http://${URL}?l=${lookup}&v=${verify}`
        debug(link)
        let textFile = path.join(__dirname, '../resources/emails/resetPassword_text.ejs')
        ejs.renderFile(textFile, { name, link }, (err, text) => {
            if (err) return debug(err)
            send(sender, to, subject, text, null)
        })
    }
}

