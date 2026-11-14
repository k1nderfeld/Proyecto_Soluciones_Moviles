const crypto = require('crypto')
const { Op } = require('sequelize')
const User = require('../models/user')
const HttpError = require('../utils/HttpError')
const tokenService = require('./token.service')
const mailer = require('./mailer.service')
const twoFactor = require('./twoFactor.service')
const oauth = require('./oauth.service')

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000
const CODE_TTL_MS = 10 * 60 * 1000

class AuthService {
    async register({ name, email, phoneNumber, password, termsAccepted }) {
        const normalizedEmail = email ? email.trim().toLowerCase() : null
        const normalizedPhone = phoneNumber ? phoneNumber.trim() : null

        if (!normalizedEmail && !normalizedPhone) {
            throw new HttpError(400, 'Debes ingresar un correo electrónico o un número de teléfono')
        }

        if (termsAccepted !== true && termsAccepted !== 'true') {
            throw new HttpError(400, 'Debes aceptar los términos de privacidad')
        }

        const duplicates = []
        if (normalizedEmail) duplicates.push({ email: normalizedEmail })
        if (normalizedPhone) duplicates.push({ phoneNumber: normalizedPhone })

        const existingUser = await User.findOne({ where: { [Op.or]: duplicates } })

        if (existingUser) {
            throw new HttpError(409, 'Ya existe una cuenta con los datos ingresados')
        }

        const emailVerificationToken = normalizedEmail
            ? crypto.randomBytes(32).toString('hex')
            : null

        const phoneVerificationCode = !normalizedEmail && normalizedPhone
            ? String(crypto.randomInt(100000, 1000000))
            : null

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phoneNumber: normalizedPhone,
            password,
            role: 'pasajero',
            authProvider: 'local',
            status: 'pending',
            termsAcceptedAt: new Date(),
            emailVerificationToken,
            emailVerificationExpiresAt: emailVerificationToken
                ? new Date(Date.now() + VERIFICATION_TTL_MS)
                : null,
            phoneVerificationCode,
            phoneVerificationExpiresAt: phoneVerificationCode
                ? new Date(Date.now() + CODE_TTL_MS)
                : null
        })

        if (emailVerificationToken) {
            await mailer.sendVerificationEmail(user, emailVerificationToken).catch(() => null)
        }

        return user
    }

    async verifyEmail(token) {
        const user = await User.findOne({ where: { emailVerificationToken: token } })

        if (!user || !user.emailVerificationExpiresAt) {
            throw new HttpError(400, 'El enlace de verificación es inválido o expiró')
        }

        if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
            throw new HttpError(400, 'El enlace de verificación es inválido o expiró')
        }

        user.emailVerified = true
        user.emailVerificationToken = null
        user.emailVerificationExpiresAt = null
        user.status = 'active'

        await user.save()

        return user
    }

    async verifyPhone({ phoneNumber, code }) {
        const user = await User.findOne({ where: { phoneNumber: phoneNumber.trim() } })

        if (!user || !user.phoneVerificationCode || !user.phoneVerificationExpiresAt) {
            throw new HttpError(400, 'El código de verificación es inválido o expiró')
        }

        const expired = user.phoneVerificationExpiresAt.getTime() < Date.now()

        if (expired || user.phoneVerificationCode !== code) {
            throw new HttpError(400, 'El código de verificación es inválido o expiró')
        }

        user.phoneVerified = true
        user.phoneVerificationCode = null
        user.phoneVerificationExpiresAt = null
        user.status = 'active'

        await user.save()

        return user
    }

    async resendVerification({ email, phoneNumber }) {
        const where = email
            ? { email: email.trim().toLowerCase() }
            : { phoneNumber: phoneNumber.trim() }

        const user = await User.findOne({ where })

        if (!user || user.status === 'disabled') {
            throw new HttpError(400, 'No se pudo reenviar la verificación')
        }

        if (email) {
            if (user.emailVerified) {
                throw new HttpError(400, 'Tu correo ya está verificado')
            }

            user.emailVerificationToken = crypto.randomBytes(32).toString('hex')
            user.emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS)

            await user.save()
            await mailer.sendVerificationEmail(user, user.emailVerificationToken).catch(() => null)
        } else {
            if (user.phoneVerified) {
                throw new HttpError(400, 'Tu teléfono ya está verificado')
            }

            user.phoneVerificationCode = String(crypto.randomInt(100000, 1000000))
            user.phoneVerificationExpiresAt = new Date(Date.now() + CODE_TTL_MS)

            await user.save()
        }

        return user
    }

    async setupTwoFactor({ email, password }) {
        const user = await this.authenticateLocal(email, password)

        const secret = twoFactor.createSecret()
        const qr = await twoFactor.createQrCode(user.email, secret)

        user.twoFactorSecret = secret
        user.twoFactorEnabled = false

        await user.save()

        return {
            secret,
            otpauthUrl: qr.otpauthUrl,
            qrCode: qr.dataUrl
        }
    }

    async enableTwoFactor({ email, password, code }) {
        const user = await this.authenticateLocal(email, password)

        if (!user.twoFactorSecret) {
            throw new HttpError(400, 'Primero debes generar el código QR')
        }

        if (!(await twoFactor.verifyCode(code, user.twoFactorSecret))) {
            throw new HttpError(400, 'El código de verificación es inválido')
        }

        user.twoFactorEnabled = true

        await user.save()

        return user
    }

    async disableTwoFactor({ email, password, code }) {
        const user = await this.authenticateLocal(email, password)

        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new HttpError(400, 'La verificación en dos pasos no está activada')
        }

        if (!(await twoFactor.verifyCode(code, user.twoFactorSecret))) {
            throw new HttpError(400, 'El código de verificación es inválido')
        }

        user.twoFactorEnabled = false
        user.twoFactorSecret = null

        await user.save()

        return user
    }

    async registerWithGoogle({ idToken, termsAccepted }) {
        const profile = await oauth.verifyGoogleToken(idToken)
        return this.registerWithProvider('google', profile, termsAccepted)
    }

    async registerWithApple({ identityToken, termsAccepted }) {
        const profile = await oauth.verifyAppleToken(identityToken)
        return this.registerWithProvider('apple', profile, termsAccepted)
    }

    async registerWithProvider(provider, profile, termsAccepted) {
        const providerIdField = provider === 'google' ? 'googleId' : 'appleId'
        const providerId = profile.providerId

        let user = await User.findOne({ where: { [providerIdField]: providerId } })

        if (!user && profile.email) {
            user = await User.findOne({ where: { email: profile.email.toLowerCase() } })

            if (user) {
                user[providerIdField] = providerId
                await user.save()
            }
        }

        if (user) {
            if (user.status === 'disabled') {
                throw new HttpError(403, 'La cuenta está deshabilitada')
            }

            return { user, token: this.signSession(user) }
        }

        if (termsAccepted !== true && termsAccepted !== 'true') {
            throw new HttpError(400, 'Debes aceptar los términos de privacidad')
        }

        user = await User.create({
            name: profile.name || (profile.email ? profile.email.split('@')[0] : 'Pasajero'),
            email: profile.email ? profile.email.toLowerCase() : null,
            photoUrl: profile.photoUrl || null,
            role: 'pasajero',
            authProvider: provider,
            [providerIdField]: providerId,
            status: 'active',
            emailVerified: Boolean(profile.email && profile.emailVerified),
            termsAcceptedAt: new Date()
        })

        return { user, token: this.signSession(user) }
    }

    createGuest() {
        return {
            token: tokenService.sign({ role: 'invitado' }, '24h')
        }
    }

    signSession(user) {
        return tokenService.sign({ sub: user.id, role: user.role })
    }

    async authenticateLocal(email, password) {
        const user = await User.findOne({ where: { email: email.trim().toLowerCase() } })
        const validPassword = user ? await user.verifyPassword(password) : false

        if (!validPassword) {
            throw new HttpError(401, 'Las credenciales son incorrectas')
        }

        if (user.status === 'disabled') {
            throw new HttpError(403, 'La cuenta está deshabilitada')
        }

        return user
    }
}

module.exports = new AuthService()
