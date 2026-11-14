const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const sign = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
        jwtid: crypto.randomUUID()
    })
}

const verify = (token) => jwt.verify(token, process.env.JWT_SECRET)

module.exports = { sign, verify }
