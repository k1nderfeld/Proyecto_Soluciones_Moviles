const nodemailer = require('nodemailer')

const transport = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    })
    : nodemailer.createTransport({ jsonTransport: true })

const sendVerificationEmail = async (user, token) => {
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const link = `${appUrl}/api/auth/verify-email?token=${token}`

    return transport.sendMail({
        from: process.env.MAIL_FROM || 'VoyBus <no-reply@voybus.app>',
        to: user.email,
        subject: 'Verifica tu cuenta de VoyBus',
        text: `Hola ${user.name}. Confirma tu correo ingresando a ${link}`,
        html: `<p>Hola ${user.name}.</p><p>Confirma tu correo para activar tu cuenta de VoyBus.</p><p><a href="${link}">Verificar mi correo</a></p>`
    })
}

module.exports = { sendVerificationEmail }
