const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const { bootTestApp } = require('./helpers/testApp')
const { createGeodexService, normalizePrediction, validateImage } = require('../src/services/geodexService')
const candidates = [{ id: 1, name: 'Basalto', scientificName: 'Basalt' }]

test('recorded real GeoDex response maps its local candidate identifier and percentage', () => {
  const payload = require('./fixtures/geodex-response.json')
  assert.deepEqual(normalizePrediction(payload, candidates, {}), { rockId: 1, confidence: 72 })
})

test('adapter maps configurable JSON paths and confidence scales and rejects unknown rocks', () => {
  assert.deepEqual(normalizePrediction({ predictions: [{ label: 'Basalt', confidence: 90 }] }, candidates, {}), { rockId: 1, confidence: 90 })
  assert.deepEqual(normalizePrediction({ matches: [{ rock: { id: 1 }, score: 90 }] }, candidates, { GEODEX_PREDICTIONS_PATH: 'matches', GEODEX_ROCK_ID_PATH: 'rock.id', GEODEX_CONFIDENCE_PATH: 'score', GEODEX_CONFIDENCE_SCALE: 'percent' }), { rockId: 1, confidence: 90 })
  assert.throws(() => normalizePrediction({ predictions: [{ label: 'Unknown', confidence: 90 }] }, candidates, {}), error => error.status === 422)
  assert.throws(() => normalizePrediction({ data: {} }, candidates, {}), error => error.status === 502)
  assert.throws(() => normalizePrediction({ predictions: [{ label: 'Basalt', confidence: 200 }] }, candidates, {}), error => error.status === 502)
})

test('image validation checks source, MIME, signature and size', () => {
  assert.throws(() => validateImage({ url: 'http://example.org/x.jpg' }), error => error.status === 400)
  assert.throws(() => validateImage({ url: 'https://example.org/x.jpg', base64: 'AAAA' }), error => error.status === 400)
  assert.throws(() => validateImage({ base64: 'AAAA', mime_type: 'image/jpeg' }), error => error.status === 400)
  const oversized = Buffer.alloc(8 * 1024 * 1024 + 1).toString('base64')
  assert.throws(() => validateImage({ base64: oversized, mime_type: 'image/png' }), error => error.status === 413)
})

test('provider errors are bounded and API keys never appear in errors', async () => {
  const models = { Rock: { findAll: async () => candidates } }
  const body = { image: { url: 'https://example.org/image.jpg' } }
  await assert.rejects(createGeodexService({ models, env: {} }).identify(body), error => error.status === 503)
  const env = { GEODEX_API_KEY: 'test-secret' }
  await assert.rejects(createGeodexService({ models, env, fetchImpl: async () => { throw new DOMException('test-secret', 'TimeoutError') } }).identify(body), error => error.status === 504 && !error.message.includes('test-secret'))
  await assert.rejects(createGeodexService({ models, env, fetchImpl: async () => ({ ok: false, status: 429 }) }).identify(body), error => error.status === 503)
})

test('HTTP recognition calls provider and commits only valid results; failure keeps guest quota', async () => {
  const app = await bootTestApp('geodex')
  let status = 200, calls = 0
  const server = http.createServer(async (req, res) => {
    calls++
    let content = ''; for await (const chunk of req) content += chunk
    const body = JSON.parse(content)
    assert.equal(req.headers['x-api-key'], 'local-test-key')
    assert.ok(body.image.url); assert.ok(body.candidates.length)
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ predictions: [{ label: 'Basalto', confidence: 94 }] }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  process.env.GEODEX_API_URL = `http://127.0.0.1:${server.address().port}`
  process.env.GEODEX_API_KEY = 'local-test-key'
  process.env.ALLOW_SIMULATED_RECOGNITION = 'false'
  try {
    const guestToken = (await app.request('POST', '/api/guest/session')).body.token
    const input = { image: { url: 'https://example.org/photo.jpg' } }
    const response = await app.request('POST', '/api/recognition', { guestToken, body: input })
    assert.equal(response.status, 201); assert.equal(response.body.analysis.confidence, 94)
    assert.equal((await app.request('POST', '/api/recognition', { guestToken, body: { rockId: 1, confidence: 100 } })).status, 400)
    status = 500
    assert.equal((await app.request('POST', '/api/recognition', { guestToken, body: input })).status, 502)
    assert.equal((await app.request('GET', '/api/guest/session', { guestToken })).body.recognitionCount, 1)
    assert.equal(await app.models.Analysis.count(), 1)
    assert.equal(calls, 2)
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve))
    await app.close()
    delete process.env.GEODEX_API_URL; delete process.env.GEODEX_API_KEY
  }
})
