const { HttpError } = require('../utils/httpError')
const { Transaction } = require('sequelize')
const { createGeodexService } = require('./geodexService')

// Only trusted model output, or explicitly enabled local demo input, reaches persistence.
const parseModelResult = (body = {}) => {
  const rockId = typeof body.rockId === 'number' || typeof body.rockId === 'string' ? Number(body.rockId) : NaN
  if (!Number.isInteger(rockId) || rockId < 1) throw new HttpError(400, 'rockId es obligatorio y debe ser un entero positivo')
  const confidence = typeof body.confidence === 'number' ? body.confidence : NaN
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 100) throw new HttpError(400, 'confidence es obligatorio y debe estar entre 0 y 100')
  for (const [field, max] of [['imageUrl', 500], ['note', 255]]) {
    if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].length > max)) throw new HttpError(400, `${field} debe ser un texto de hasta ${max} caracteres`)
  }
  return { rockId, confidence: Math.round(confidence), imageUrl: body.imageUrl ?? null, note: body.note ?? null }
}

const createRecognitionService = ({ models, sequelize, guestSessions, achievements }) => ({
  // `actor` is { kind: 'user', id } or { kind: 'guest', id }. Everything happens in one transaction so a failed step
  // (for example the guest limit) never leaves a half-recorded recognition behind.
  async recognize(actor, body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Se requiere un objeto JSON')
    if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 255)) throw new HttpError(400, 'note debe ser un texto de hasta 255 caracteres')
    if (actor.kind === 'guest') {
      const current = await models.GuestSession.findByPk(actor.id)
      if (!current || current.status !== 'active' || current.expiresAt <= new Date()) throw new HttpError(401, 'La sesión de invitado ya no está activa')
      if (current.recognitionCount >= guestSessions.limit) throw new HttpError(403, 'Alcanzaste el límite de reconocimientos. Crea una cuenta para continuar.', 'GUEST_LIMIT_REACHED')
    }
    if (!body.image && (process.env.ALLOW_SIMULATED_RECOGNITION !== 'true' || process.env.NODE_ENV === 'production')) throw new HttpError(400, 'Envía image.url o image.base64 para reconocer una roca')
    const input = parseModelResult(body.image ? await createGeodexService({ models }).identify(body) : body)
    const rock = await models.Rock.findByPk(input.rockId)
    if (!rock) throw new HttpError(404, 'Roca no encontrada')
    const ownerWhere = actor.kind === 'user' ? { userId: actor.id } : { guestSessionId: actor.id }

    return sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
      if (!await models.Rock.findByPk(rock.id, { transaction })) throw new HttpError(404, 'Roca no encontrada')
      let session = null
      if (actor.kind === 'guest') {
        session = await models.GuestSession.findByPk(actor.id, { transaction })
        if (!session || session.status !== 'active' || session.expiresAt <= new Date()) throw new HttpError(401, 'La sesión de invitado ya no está activa')
        if (session.recognitionCount >= guestSessions.limit) {
          throw new HttpError(403, `Alcanzaste el límite de ${guestSessions.limit} reconocimientos para invitados. Crea una cuenta para continuar.`, 'GUEST_LIMIT_REACHED')
        }
        await session.update({ recognitionCount: session.recognitionCount + 1 }, { transaction })
      }

      const analysis = await models.Analysis.create({ ...ownerWhere, rockId: rock.id, image_url: input.imageUrl, confidence: input.confidence, result: rock.name, note: input.note }, { transaction })

      let entry = await models.Collection.findOne({ where: { ...ownerWhere, rockId: rock.id }, transaction, paranoid: false })
      if (entry?.deletedAt) await entry.restore({ transaction })
      const newDiscovery = !entry
      if (entry) await entry.update({ recognitionCount: entry.recognitionCount + 1 }, { transaction })
      else entry = await models.Collection.create({ ...ownerWhere, rockId: rock.id, firstDiscoveredAt: new Date(), recognitionCount: 1 }, { transaction })

      const unlockedAchievements = await achievements.evaluate(actor, { transaction })
      return {
        analysis,
        collection: { rockId: entry.rockId, recognitionCount: entry.recognitionCount, firstDiscoveredAt: entry.firstDiscoveredAt },
        newDiscovery,
        unlockedAchievements,
        ...(session ? { guest: guestSessions.describe(session) } : {})
      }
    })
  }
})

module.exports = { createRecognitionService, parseModelResult }
