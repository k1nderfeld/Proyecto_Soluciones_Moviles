const authService = require('../services/auth.services')

const asyncHandler = (handler) => (req, res, next) => {
    return Promise.resolve(handler(req, res, next)).catch(next)
}

const register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body)

    return res.status(201).json({
        success: true,
        message: 'Tu cuenta fue creada. Verifica tu medio de contacto para activarla.',
        data: { user }
    })
})

const verifyEmail = asyncHandler(async (req, res) => {
    const user = await authService.verifyEmail(req.body.token)

    return res.status(200).json({
        success: true,
        message: 'Tu correo fue verificado. La cuenta está activa.',
        data: { user }
    })
})

const verifyPhone = asyncHandler(async (req, res) => {
    const user = await authService.verifyPhone(req.body)

    return res.status(200).json({
        success: true,
        message: 'Tu teléfono fue verificado. La cuenta está activa.',
        data: { user }
    })
})

const resendVerification = asyncHandler(async (req, res) => {
    const user = await authService.resendVerification(req.body)

    return res.status(200).json({
        success: true,
        message: req.body.email
            ? 'Enviamos un nuevo enlace de verificación a tu correo.'
            : 'Enviamos un nuevo código de verificación a tu teléfono.',
        data: { user }
    })
})

const setupTwoFactor = asyncHandler(async (req, res) => {
    const data = await authService.setupTwoFactor(req.body)

    return res.status(200).json({
        success: true,
        message: 'Escanea el código QR y confirma el código de seis dígitos.',
        data
    })
})

const enableTwoFactor = asyncHandler(async (req, res) => {
    const user = await authService.enableTwoFactor(req.body)

    return res.status(200).json({
        success: true,
        message: 'La verificación en dos pasos fue activada.',
        data: { user }
    })
})

const disableTwoFactor = asyncHandler(async (req, res) => {
    const user = await authService.disableTwoFactor(req.body)

    return res.status(200).json({
        success: true,
        message: 'La verificación en dos pasos fue desactivada.',
        data: { user }
    })
})

const registerWithGoogle = asyncHandler(async (req, res) => {
    const { user, token } = await authService.registerWithGoogle(req.body)

    return res.status(200).json({
        success: true,
        message: 'Cuenta de pasajero lista.',
        data: { user, token }
    })
})

const registerWithApple = asyncHandler(async (req, res) => {
    const { user, token } = await authService.registerWithApple(req.body)

    return res.status(200).json({
        success: true,
        message: 'Cuenta de pasajero lista.',
        data: { user, token }
    })
})

const createGuest = asyncHandler(async (req, res) => {
    const data = authService.createGuest()

    return res.status(200).json({
        success: true,
        message: 'Acceso como invitado habilitado.',
        data
    })
})

module.exports = {
    register,
    verifyEmail,
    verifyPhone,
    resendVerification,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    registerWithGoogle,
    registerWithApple,
    createGuest
}
