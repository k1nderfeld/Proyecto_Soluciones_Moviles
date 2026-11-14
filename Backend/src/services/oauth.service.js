const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa')
const { OAuth2Client } = require('google-auth-library')
const HttpError = require('../utils/HttpError')

const appleKeys = jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys' })

const getAppleKey = (header, callback) => {
    appleKeys.getSigningKey(header.kid, (error, key) => {
        if (error) return callback(error)
        callback(null, key.getPublicKey())
    })
}

const verifyGoogleToken = async (idToken) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        throw new HttpError(503, 'El registro con Google no está configurado')
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

    let payload
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        })
        payload = ticket.getPayload()
    } catch (error) {
        throw new HttpError(401, 'El token de Google es inválido')
    }

    return {
        providerId: payload.sub,
        email: payload.email,
        name: payload.name,
        photoUrl: payload.picture,
        emailVerified: Boolean(payload.email_verified)
    }
}

const verifyAppleToken = (identityToken) => {
    if (!process.env.APPLE_CLIENT_ID) {
        return Promise.reject(new HttpError(503, 'El registro con Apple no está configurado'))
    }

    return new Promise((resolve, reject) => {
        jwt.verify(identityToken, getAppleKey, {
            algorithms: ['RS256'],
            issuer: 'https://appleid.apple.com',
            audience: process.env.APPLE_CLIENT_ID
        }, (error, payload) => {
            if (error) return reject(new HttpError(401, 'El token de Apple es inválido'))

            resolve({
                providerId: payload.sub,
                email: payload.email,
                name: null,
                photoUrl: null,
                emailVerified: true
            })
        })
    })
}

module.exports = { verifyGoogleToken, verifyAppleToken }
