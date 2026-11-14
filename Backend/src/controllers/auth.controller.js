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
    const data = await authService.registerWithGoogle(req.body)

    return res.status(200).json({
        success: true,
        message: data.twoFactorRequired
            ? 'Ingresa el código de tu aplicación autenticadora para continuar.'
            : 'Cuenta de pasajero lista.',
        data
    })
})

const registerWithApple = asyncHandler(async (req, res) => {
    const data = await authService.registerWithApple(req.body)

    return res.status(200).json({
        success: true,
        message: data.twoFactorRequired
            ? 'Ingresa el código de tu aplicación autenticadora para continuar.'
            : 'Cuenta de pasajero lista.',
        data
    })
})

const login = asyncHandler(async (req, res) => {
    const data = await authService.login(req.body)

    return res.status(200).json({
        success: true,
        message: data.twoFactorRequired
            ? 'Ingresa el código de tu aplicación autenticadora para continuar.'
            : 'Sesión iniciada correctamente.',
        data
    })
})

const loginTwoFactor = asyncHandler(async (req, res) => {
    const data = await authService.loginTwoFactor(req.body)

    return res.status(200).json({
        success: true,
        message: 'Sesión iniciada correctamente.',
        data
    })
})

const me = asyncHandler(async (req, res) => {
    if (req.guest) {
        return res.status(200).json({
            success: true,
            message: 'Sesión de invitado.',
            data: { guest: true, role: 'invitado' }
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Sesión activa.',
        data: { user: req.user }
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

const logout = asyncHandler(async (req, res) => {
    await authService.logout(req.token)

    return res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente.'
    })
})

const forgotPassword = asyncHandler(async (req, res) => {
    await authService.requestPasswordReset(req.body)

    return res.status(200).json({
        success: true,
        message: 'Si el correo pertenece a una cuenta verificada, enviamos un enlace para restablecer la contraseña.'
    })
})

const resetPassword = asyncHandler(async (req, res) => {
    const user = await authService.resetPassword(req.body)

    return res.status(200).json({
        success: true,
        message: 'Tu contraseña fue actualizada.',
        data: { user }
    })
})

const changePassword = asyncHandler(async (req, res) => {
    const data = await authService.changePassword(req.user, req.body)

    return res.status(200).json({
        success: true,
        message: 'Tu contraseña fue actualizada.',
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
    createGuest,
    login,
    loginTwoFactor,
    me,
    logout,
    forgotPassword,
    resetPassword,
    changePassword
}
