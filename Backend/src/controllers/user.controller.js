const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { Op, Transaction } = require('sequelize')
const models = require('../models')
const { ROLE_NAMES } = require('../utils/roles')
const { jwtSecret } = require('../config/auth')
const { HttpError } = require('../utils/httpError')
const { createGuestMigrationService } = require('../services/guestMigrationService')
const { createAchievementService } = require('../services/achievementService')
const { User, Role, sequelize } = models
const migration = createGuestMigrationService({ models, achievements: createAchievementService({ models }) })
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const register = async (req, res, next) => {
  try {
    const { userName, email, password, phone } = req.body || {}
    if (typeof userName !== 'string' || !userName.trim() || userName.length > 255) throw new HttpError(400, 'userName debe ser un texto no vacío de hasta 255 caracteres')
    if (typeof email !== 'string' || email.length > 255 || !emailRegex.test(email)) throw new HttpError(400, 'El correo electrónico no es válido')
    if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres y hasta 72 bytes')
    if (phone != null && (typeof phone !== 'string' || phone.length > 255)) throw new HttpError(400, 'phone debe ser texto de hasta 255 caracteres')
    const guestToken = req.body.guestToken ?? req.header('X-Guest-Token')
    const normalizedEmail = email.trim().toLowerCase()
    const hashedPassword = await bcryptjs.hash(password, 10)
    const result = await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      const existing = await User.findOne({ where: { [Op.or]: [{ userName: userName.trim() }, { email: normalizedEmail }] }, paranoid: false, transaction })
      if (existing) throw new HttpError(409, 'El nombre de usuario o correo ya existe')
      const [role] = await Role.findOrCreate({ where: { name: ROLE_NAMES.USER }, transaction })
      const user = await User.create({ userName: userName.trim(), email: normalizedEmail, password: hashedPassword,
        phone: phone?.trim() || null, roleId: role.id }, { transaction })
      const transferred = guestToken !== undefined ? await migration.transfer(user.id, guestToken, transaction) : null
      return { user, ...(transferred ? { migration: transferred } : {}) }
    })
    return res.status(201).json({ message: 'Registro realizado correctamente', ...result })
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') return next(new HttpError(409, 'El usuario, correo o teléfono ya está registrado'))
    return next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {}
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) throw new HttpError(400, 'email y password son obligatorios y deben ser texto')
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } })
    if (!user || !await bcryptjs.compare(password, user.password)) throw new HttpError(401, 'Credenciales inválidas')
    if (user.status !== 'active') throw new HttpError(403, 'La cuenta está bloqueada, contacte soporte.')
    const token = jwt.sign({ id: user.id, email: user.email, roleId: user.roleId }, jwtSecret(), { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '1d' })
    return res.json({ message: 'Inicio de sesión correcto', token, user })
  } catch (error) { return next(error) }
}

const me = (req, res) => res.json(req.user)
const updateMe = async (req, res, next) => {
  try {
    const changes = {}
    for (const field of ['userName', 'phone']) {
      if (req.body[field] === undefined) continue
      if (typeof req.body[field] !== 'string' || !req.body[field].trim() || req.body[field].length > 255) throw new HttpError(400, `${field} debe ser un texto no vacío de hasta 255 caracteres`)
      changes[field] = req.body[field].trim()
    }
    await req.user.update(changes)
    return res.json(req.user)
  } catch (error) { return next(error) }
}
module.exports = { register, login, me, updateMe }
