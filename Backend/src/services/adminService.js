const { fn, col, Transaction } = require('sequelize')
const { HttpError } = require('../utils/httpError')
const { positiveId } = require('../utils/validation')
const { buildListOptions } = require('../utils/queryOptions')

const createAdminService = ({ models, collections, progress }) => {
  const userById = async id => {
    const user = await models.User.findByPk(positiveId(id))
    if (!user) throw new HttpError(404, 'Usuario no encontrado')
    return user
  }
  const list = async (Model, query, filters, include) => {
    const options = buildListOptions(query, [])
    const where = {}
    for (const field of filters) if (query[field] !== undefined) where[field] = positiveId(query[field], field)
    const result = await Model.findAndCountAll({ ...options, where, include, order: [['createdAt', 'DESC'], ['id', 'DESC']] })
    return { items: result.rows, total: result.count, page: Number(query.page || 1), limit: options.limit }
  }
  return {
    async stats() {
      const [registeredUsers, totalRecognitions, grouped] = await Promise.all([
        models.User.count(), models.Analysis.count(), models.Analysis.findAll({ attributes: ['rockId', [fn('COUNT', col('id')), 'count']],
          group: ['rockId'], order: [[fn('COUNT', col('id')), 'DESC'], ['rockId', 'ASC']], limit: 5, raw: true })
      ])
      const mostRecognizedRocks = await Promise.all(grouped.map(async row => {
        const rock = await models.Rock.findByPk(row.rockId, { paranoid: false })
        return { rockId: row.rockId, name: rock?.name || null, count: Number(row.count) }
      }))
      return { registeredUsers, totalRecognitions, mostRecognizedRocks }
    },
    history: (query = {}) => list(models.Analysis, query, ['userId', 'rockId'], [{ model: models.Rock, as: 'rock', paranoid: false }]),
    feedback: (query = {}) => list(models.Feedback, query, ['userId', 'analysisId'], [{ model: models.Analysis, as: 'analysis', paranoid: false }]),
    async updateUser(actorId, id, body = {}) {
      const changes = {}
      if (body.roleId !== undefined) changes.roleId = positiveId(body.roleId, 'roleId')
      if (body.status !== undefined) {
        if (!['active', 'blocked'].includes(body.status)) throw new HttpError(400, 'status debe ser active o blocked')
        changes.status = body.status
      }
      if (!Object.keys(changes).length) throw new HttpError(400, 'Indica roleId o status')
      return models.sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
        const user = await models.User.findByPk(positiveId(id), { transaction })
        if (!user) throw new HttpError(404, 'Usuario no encontrado')
        const role = await models.Role.findByPk(changes.roleId ?? user.roleId, { transaction })
        if (!role) throw new HttpError(400, 'Rol no válido')
        if (role.name === 'Usuario no autenticado') throw new HttpError(400, 'Los invitados utilizan sesiones, no cuentas registradas')
        if (user.id === actorId && (changes.status === 'blocked' || role.name !== 'Admin')) throw new HttpError(409, 'No puedes bloquearte ni quitarte el rol Admin')
        await user.update(changes, { transaction })
        return user
      })
    },
    async collection(id) { const user = await userById(id); return collections.listForUser(user.id) },
    async achievements(id) { const user = await userById(id); return progress.achievements({ kind: 'user', id: user.id }) }
  }
}
module.exports = { createAdminService }
