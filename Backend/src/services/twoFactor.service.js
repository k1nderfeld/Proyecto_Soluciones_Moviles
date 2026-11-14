const { generateSecret, generateURI, verify } = require('otplib')
const qrcode = require('qrcode')

const ISSUER = 'VoyBus'

const createSecret = () => generateSecret()

const createQrCode = async (account, secret) => {
    const otpauthUrl = generateURI({ issuer: ISSUER, label: account, secret })
    const dataUrl = await qrcode.toDataURL(otpauthUrl)

    return { otpauthUrl, dataUrl }
}

const verifyCode = async (code, secret) => {
    const result = await verify({ secret, token: code })
    return result.valid
}

module.exports = { createSecret, createQrCode, verifyCode }
