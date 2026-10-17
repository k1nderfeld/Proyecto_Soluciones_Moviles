const { Transaction } = require('sequelize')
const { HttpError } = require('../utils/httpError')
const { hashToken } = require('./guestSessionService')

const createGuestMigrationService = ({ models, achievements }) => {
  // IMMEDIATE serializes SQLite writers. Claim, merge and invalidation commit together.
  const transfer = async (userId, token, transaction) => {
    if (typeof token !== 'string' || !token) throw new HttpError(400, 'Se requiere el token de invitado')
    const session = await models.GuestSession.findOne({ where: { tokenHash: hashToken(token) }, transaction })
    if (!session) throw new HttpError(401, 'Sesión de invitado no válida')
    if (session.status !== 'active') throw new HttpError(409, 'La sesión ya fue transferida')
    if (session.expiresAt <= new Date()) throw new HttpError(401, 'La sesión de invitado expiró')
    const user = await models.User.findByPk(userId, { transaction })
    if (!user || user.status !== 'active') throw new HttpError(401, 'Usuario no autorizado')

    const entries = await models.Collection.findAll({ where: { guestSessionId: session.id }, transaction, paranoid: false })
    for (const entry of entries) {
      const existing = await models.Collection.findOne({ where: { userId, rockId: entry.rockId }, transaction, paranoid: false })
      if (existing) {
        if (existing.deletedAt) await existing.restore({ transaction })
        await existing.update({ recognitionCount: existing.recognitionCount + entry.recognitionCount,
          firstDiscoveredAt: new Date(Math.min(+existing.firstDiscoveredAt, +entry.firstDiscoveredAt)) }, { transaction })
        await entry.destroy({ force: true, transaction })
      } else {
        if (entry.deletedAt) await entry.restore({ transaction })
        await entry.update({ userId, guestSessionId: null }, { transaction })
      }
    }
    const unlocks = await models.GuestAchievement.findAll({ where: { guestSessionId: session.id }, transaction })
    for (const unlock of unlocks) {
      const [owned, created] = await models.UserAchievement.findOrCreate({ where: { userId, achievementId: unlock.achievementId },
        defaults: { unlockedAt: unlock.unlockedAt }, transaction })
      if (!created && +unlock.unlockedAt < +owned.unlockedAt) await owned.update({ unlockedAt: unlock.unlockedAt }, { transaction })
    }
    await models.GuestAchievement.destroy({ where: { guestSessionId: session.id }, transaction })
    // Move history too: statistics and recognition ownership must survive account creation.
    const [recognitions] = await models.Analysis.update({ userId, guestSessionId: null }, { where: { guestSessionId: session.id }, transaction, paranoid: false })
    await session.update({ status: 'transferred', transferredToUserId: userId }, { transaction })
    const unlockedAchievements = await achievements.evaluate({ kind: 'user', id: userId }, { transaction })
    return { status: 'transferred', discoveries: entries.length, recognitions, achievements: unlocks.length, unlockedAchievements }
  }
  return { transfer,
    migrate: (userId, token) => models.sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, transaction => transfer(userId, token, transaction)) }
}
module.exports = { createGuestMigrationService }
