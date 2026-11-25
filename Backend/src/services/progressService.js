const { buildListOptions } = require('../utils/queryOptions')
const { ownerWhere } = require('../utils/validation')

const createProgressService = ({ models }) => {
  const unlockModel = actor => actor.kind === 'guest' ? models.GuestAchievement : models.UserAchievement
  return {
    async stats(actor) {
      const where = ownerWhere(actor)
      const [totalRecognitions, distinctRocks, unlockedAchievements, catalogTotal, availableDiscoveries] = await Promise.all([
        models.Analysis.count({ where }), models.Collection.count({ where }), unlockModel(actor).count({ where }),
        models.Rock.count(),
        models.Collection.count({ where, include: [{ model: models.Rock, as: 'rock', required: true }] })
      ])
      return { totalRecognitions, distinctRocks, unlockedAchievements,
        discoveryPercentage: catalogTotal ? Math.min(100, Math.round(availableDiscoveries / catalogTotal * 1000) / 10) : 0 }
    },
    async history(actor, query = {}) {
      const options = buildListOptions(query, [])
      const result = await models.Analysis.findAndCountAll({ ...options, where: ownerWhere(actor),
        include: [{ model: models.Rock, as: 'rock', paranoid: false }], order: [['createdAt', 'DESC'], ['id', 'DESC']] })
      return { items: result.rows, total: result.count, page: Number(query.page || 1), limit: options.limit }
    },
    async achievements(actor) {
      const [catalog, unlocks] = await Promise.all([
        models.Achievement.findAll({ where: { isActive: true }, order: [['id', 'ASC']] }),
        unlockModel(actor).findAll({ where: ownerWhere(actor) })
      ])
      const owned = new Map(unlocks.map(row => [row.achievementId, row.unlockedAt]))
      const items = catalog.map(row => ({ ...row.toJSON(), unlocked: owned.has(row.id), unlockedAt: owned.get(row.id) || null }))
      return { items, total: items.length }
    }
  }
}
module.exports = { createProgressService }
