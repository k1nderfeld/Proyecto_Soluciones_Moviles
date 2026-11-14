const { Router } = require('express')
const { body } = require('express-validator')
const validateFields = require('../middlewares/validateFields')
const authenticate = require('../middlewares/authenticate')
const {
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
} = require('../controllers/auth.controller')

const router = Router()

const passwordRules = (field = 'password') => [
    body(field)
        .notEmpty().withMessage('La contraseña es obligatoria')
        .isLength({ min: 8, max: 15 }).withMessage('La contraseña debe tener entre 8 y 15 caracteres')
        .matches(/[a-z]/).withMessage('La contraseña debe incluir al menos una letra minúscula')
        .matches(/[A-Z]/).withMessage('La contraseña debe incluir al menos una letra mayúscula')
        .matches(/\d/).withMessage('La contraseña debe incluir al menos un número')
        .matches(/[^A-Za-z0-9]/).withMessage('La contraseña debe incluir al menos un símbolo')
]

const emailRule = (field = 'email', required = true) => {
    const rule = required
        ? body(field).notEmpty().withMessage('El correo es obligatorio')
        : body(field).optional({ values: 'falsy' })

    return rule
        .trim()
        .toLowerCase()
        .isEmail().withMessage('El formato de correo ingresado es inválido')
}

const termsRule = body('termsAccepted')
    .custom((value) => value === true || value === 'true')
    .withMessage('Debes aceptar los términos de privacidad')

const codeRule = body('code')
    .trim()
    .notEmpty().withMessage('El código es obligatorio')
    .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos')
    .isNumeric().withMessage('El código debe tener 6 dígitos')

const credentialRules = [
    emailRule(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
]

router.post('/register', [
    body('name')
        .trim()
        .notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres'),
    body('email')
        .custom((value, { req }) => {
            if (!value && !req.body.phoneNumber) {
                throw new Error('Debes ingresar un correo electrónico o un número de teléfono')
            }
            return true
        })
        .optional({ values: 'falsy' })
        .trim()
        .toLowerCase()
        .isEmail().withMessage('El formato de correo ingresado es inválido'),
    body('phoneNumber')
        .optional({ values: 'falsy' })
        .trim()
        .matches(/^\+?\d{7,15}$/).withMessage('El número de teléfono es inválido'),
    ...passwordRules(),
    body('confirmPassword')
        .notEmpty().withMessage('Debes confirmar la contraseña')
        .custom((value, { req }) => value === req.body.password)
        .withMessage('Las contraseñas no coinciden'),
    termsRule,
    validateFields,
    register
])

router.post('/verify-email', [
    body('token').trim().notEmpty().withMessage('El token es obligatorio'),
    validateFields,
    verifyEmail
])

router.post('/verify-phone', [
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('El número de teléfono es obligatorio')
        .matches(/^\+?\d{7,15}$/).withMessage('El número de teléfono es inválido'),
    codeRule,
    validateFields,
    verifyPhone
])

router.post('/resend-verification', [
    body('email')
        .custom((value, { req }) => {
            if (!value && !req.body.phoneNumber) {
                throw new Error('Debes indicar un correo electrónico o un número de teléfono')
            }
            return true
        })
        .optional({ values: 'falsy' })
        .trim()
        .toLowerCase()
        .isEmail().withMessage('El formato de correo ingresado es inválido'),
    body('phoneNumber')
        .optional({ values: 'falsy' })
        .trim()
        .matches(/^\+?\d{7,15}$/).withMessage('El número de teléfono es inválido'),
    validateFields,
    resendVerification
])

router.post('/2fa/setup', [
    ...credentialRules,
    validateFields,
    setupTwoFactor
])

router.post('/2fa/enable', [
    ...credentialRules,
    codeRule,
    validateFields,
    enableTwoFactor
])

router.post('/2fa/disable', [
    ...credentialRules,
    codeRule,
    validateFields,
    disableTwoFactor
])

router.post('/google', [
    body('idToken').trim().notEmpty().withMessage('El token de Google es obligatorio'),
    termsRule,
    validateFields,
    registerWithGoogle
])

router.post('/apple', [
    body('identityToken').trim().notEmpty().withMessage('El token de Apple es obligatorio'),
    termsRule,
    validateFields,
    registerWithApple
])

router.post('/guest', createGuest)

router.post('/login', [
    body('identifier')
        .trim()
        .notEmpty().withMessage('El correo o el teléfono es obligatorio'),
    body('password')
        .notEmpty().withMessage('La contraseña es obligatoria'),
    validateFields,
    login
])

router.post('/login/2fa', [
    body('challengeToken')
        .trim()
        .notEmpty().withMessage('El desafío de verificación es obligatorio'),
    codeRule,
    validateFields,
    loginTwoFactor
])

router.get('/me', authenticate, me)

router.post('/logout', authenticate, logout)

router.post('/password/forgot', [
    body('email')
        .trim()
        .notEmpty().withMessage('El correo es obligatorio')
        .toLowerCase()
        .isEmail().withMessage('El formato de correo ingresado es inválido'),
    validateFields,
    forgotPassword
])

router.post('/password/reset', [
    body('token')
        .trim()
        .notEmpty().withMessage('El token es obligatorio'),
    ...passwordRules('newPassword'),
    body('confirmPassword')
        .notEmpty().withMessage('Debes confirmar la contraseña')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Las contraseñas no coinciden'),
    validateFields,
    resetPassword
])

router.post('/password/change', authenticate, [
    body('currentPassword')
        .notEmpty().withMessage('La contraseña actual es obligatoria'),
    ...passwordRules('newPassword'),
    body('confirmPassword')
        .notEmpty().withMessage('Debes confirmar la contraseña')
        .custom((value, { req }) => value === req.body.newPassword)
        .withMessage('Las contraseñas no coinciden'),
    validateFields,
    changePassword
])

module.exports = router
