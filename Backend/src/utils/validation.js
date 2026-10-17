const { HttpError } = require('./httpError')

const positiveId = (value, name = 'id') => {
  if (!['number', 'string'].includes(typeof value) || !/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
    throw new HttpError(400, `${name} debe ser un entero positivo`)
  }
  return Number(value)
}
const ownerWhere = actor => actor.kind === 'guest' ? { guestSessionId: actor.id } : { userId: actor.id }
module.exports = { positiveId, ownerWhere }
