const { HttpError } = require('../utils/httpError')

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const validateImage = image => {
  if (!image || typeof image !== 'object' || Array.isArray(image) || Boolean(image.url) === Boolean(image.base64)) throw new HttpError(400, 'image debe contener exactamente url o base64')
  if (image.url) {
    let url
    try { url = new URL(image.url) } catch { throw new HttpError(400, 'image.url no es una URL válida') }
    if (typeof image.url !== 'string' || url.protocol !== 'https:' || url.username || url.password || image.url.length > 500) throw new HttpError(400, 'image.url debe ser HTTPS y tener hasta 500 caracteres')
    return { url: url.href }
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(image.mime_type)) throw new HttpError(400, 'mime_type debe ser image/jpeg, image/png o image/webp')
  if (typeof image.base64 !== 'string' || !image.base64.length || image.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.base64)) throw new HttpError(400, 'image.base64 no es válido; envía base64 sin prefijo data:')
  const bytes = Buffer.from(image.base64, 'base64')
  if (bytes.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'La imagen supera 8 MB')
  const signatures = {
    'image/jpeg': bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    'image/png': bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    'image/webp': bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  }
  if (!signatures[image.mime_type]) throw new HttpError(400, 'El contenido no corresponde al tipo de imagen indicado')
  return { base64: image.base64, mime_type: image.mime_type }
}

// Defaults match the GeoDex response verified against /api/v1/identify.
// Optional JSON paths support future provider contract changes.
const atPath = (value, path) => path.split('.').filter(Boolean).reduce((current, key) => current?.[key], value)
const normalizePrediction = (payload, candidates, env = process.env) => {
  if (payload?.success === false) throw new HttpError(502, 'GeoDex no pudo identificar la imagen')
  const predictions = atPath(payload, env.GEODEX_PREDICTIONS_PATH || 'predictions')
  if (!Array.isArray(predictions) || !predictions.length) throw new HttpError(502, 'Respuesta de GeoDex sin predicciones válidas; revisa GEODEX_PREDICTIONS_PATH', 'INVALID_MODEL_RESPONSE')
  const rows = predictions.map(prediction => {
    const id = atPath(prediction, env.GEODEX_ROCK_ID_PATH || 'catalog.rockId')
    const name = atPath(prediction, env.GEODEX_ROCK_NAME_PATH || 'label')
    const confidence = atPath(prediction, env.GEODEX_CONFIDENCE_PATH || 'confidence')
    const scale = env.GEODEX_CONFIDENCE_SCALE || 'percent'
    if (!['fraction', 'percent'].includes(scale)) throw new HttpError(503, 'GEODEX_CONFIDENCE_SCALE debe ser fraction o percent')
    const score = typeof confidence === 'number' ? confidence * (scale === 'percent' ? 1 : 100) : NaN
    if (!Number.isFinite(score) || score < 0 || score > 100) throw new HttpError(502, 'GeoDex devolvió una confianza no válida', 'INVALID_MODEL_RESPONSE')
    const rock = candidates.find(row => String(row.id) === String(id)) || (typeof name === 'string'
      ? candidates.find(row => [row.name, row.scientificName].some(label => label.toLowerCase() === name.trim().toLowerCase()))
      : undefined)
    return { rock, score }
  }).sort((a, b) => b.score - a.score)
  const best = rows[0]
  if (!best.rock) throw new HttpError(422, 'La roca reconocida no está en el catálogo local', 'ROCK_NOT_IN_CATALOG')
  return { rockId: best.rock.id, confidence: best.score }
}

const createGeodexService = ({ models, fetchImpl = fetch, env = process.env }) => ({
  async identify(body) {
    const image = validateImage(body.image)
    if (!env.GEODEX_API_KEY) throw new HttpError(503, 'Configura GEODEX_API_KEY para reconocer imágenes', 'MODEL_NOT_CONFIGURED')
    const endpoint = new URL('/api/v1/identify', env.GEODEX_API_URL || 'https://geodex-ml-api-76365064073.southamerica-west1.run.app')
    if (endpoint.protocol !== 'https:' && !(env.NODE_ENV === 'test' && endpoint.hostname === '127.0.0.1')) throw new HttpError(503, 'La API de reconocimiento debe utilizar HTTPS')
    if (body.observations !== undefined && (!body.observations || typeof body.observations !== 'object' || Array.isArray(body.observations))) throw new HttpError(400, 'observations debe ser un objeto JSON')
    const rocks = await models.Rock.findAll({ order: [['id', 'ASC']] })
    if (!rocks.length) throw new HttpError(409, 'No hay rocas disponibles en el catálogo')
    const timeout = Number(env.GEODEX_TIMEOUT_MS || 30000)
    if (!Number.isInteger(timeout) || timeout < 100 || timeout > 120000) throw new HttpError(503, 'GEODEX_TIMEOUT_MS debe estar entre 100 y 120000')
    let response, payload
    try {
      response = await fetchImpl(endpoint, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', 'X-API-Key': env.GEODEX_API_KEY },
        body: JSON.stringify({ image, observations: body.observations, top_k: 3,
          candidates: rocks.map(rock => ({ rockId: rock.id, name: rock.name, scientificName: rock.scientificName })) }),
        signal: AbortSignal.timeout(timeout) })
      if (!response.ok) throw new HttpError(response.status === 429 ? 503 : 502, 'El servicio de reconocimiento no está disponible', 'MODEL_UNAVAILABLE')
      payload = await response.json()
    } catch (error) {
      if (error instanceof HttpError) throw error
      throw new HttpError(error.name === 'TimeoutError' || error.name === 'AbortError' ? 504 : 502, 'No se pudo obtener una respuesta válida del servicio de reconocimiento', 'MODEL_UNAVAILABLE')
    }
    return { ...normalizePrediction(payload, rocks, env), ...(image.url ? { imageUrl: image.url } : {}), ...(body.note !== undefined ? { note: body.note } : {}) }
  }
})
module.exports = { createGeodexService, normalizePrediction, validateImage }
