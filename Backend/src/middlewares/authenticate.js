const jwt = require('jsonwebtoken')
const User = require('../models/user')
const RevokedToken = require('../models/revokedToken')
const HttpError = require('../utils/HttpError')

const authenticate = async (req, res, next) => {
    try {
        const [scheme, token] = (req.headers.authorization || '').split(' ')

        if (scheme !== 'Bearer' || !token) {
            throw new HttpError(401, 'Debes iniciar sesión para continuar')
        }

        let payload
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET)
        } catch (error) {
            throw new HttpError(401, 'Tu sesión es inválida o expiró')
        }

        if (payload.scope === '2fa') {
            throw new HttpError(401, 'Tu sesión es inválida o expiró')
        }

        if (payload.jti) {
            const revoked = await RevokedToken.findOne({ where: { jti: payload.jti } })

            if (revoked) {
                throw new HttpError(401, 'Tu sesión es inválida o expiró')
            }
        }

        req.token = payload

        if (payload.role === 'invitado') {
            req.user = null
            req.guest = true
            return next()
        }

        const user = await User.findByPk(payload.sub)

        if (!user || user.status === 'disabled') {
            throw new HttpError(401, 'Tu sesión es inválida o expiró')
        }

        req.user = user
        req.guest = false

        return next()
    } catch (error) {
        return next(error)
    }
}

module.exports = authenticate
