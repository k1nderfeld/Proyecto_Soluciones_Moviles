const { HttpError } = require('../utils/httpError')
const { positiveId } = require('../utils/validation')

const createFeedbackService = ({ models }) => {
  const ownedAnalysis = async (userId, id) => {
    const analysis = await models.Analysis.findOne({ where: { id: positiveId(id), userId } })
    if (!analysis) throw new HttpError(404, 'Reconocimiento no encontrado')
    return analysis
  }
  const fields = (body, partial = false) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Se requiere un objeto JSON')
    const values = {}
    if (!partial || body.isCorrect !== undefined) {
      if (typeof body.isCorrect !== 'boolean') throw new HttpError(400, 'isCorrect debe ser booleano')
      values.isCorrect = body.isCorrect
    }
    if (body.comment !== undefined) {
      if (body.comment !== null && (typeof body.comment !== 'string' || body.comment.length > 2000)) throw new HttpError(400, 'comment debe ser texto de hasta 2000 caracteres o null')
      values.comment = body.comment === null ? null : body.comment.trim()
    }
    if (!Object.keys(values).length) throw new HttpError(400, 'Indica isCorrect o comment')
    return values
  }
  const get = async (userId, id) => {
    const analysis = await ownedAnalysis(userId, id)
    const feedback = await models.Feedback.findOne({ where: { analysisId: analysis.id, userId } })
    if (!feedback) throw new HttpError(404, 'Retroalimentación no encontrada')
    return feedback
  }
  return {
    get,
    async create(userId, id, body) {
      const analysis = await ownedAnalysis(userId, id)
      const values = fields(body)
      try { return await models.Feedback.create({ ...values, analysisId: analysis.id, userId }) }
      catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') throw new HttpError(409, 'Este reconocimiento ya tiene retroalimentación')
        throw error
      }
    },
    async update(userId, id, body) {
      const feedback = await get(userId, id)
      return feedback.update(fields(body, true))
    }
  }
}
module.exports = { createFeedbackService }
