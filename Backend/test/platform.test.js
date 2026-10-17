const test = require('node:test')
const assert = require('node:assert/strict')
const { bootTestApp } = require('./helpers/testApp')
let app, rocks, adminToken
test.before(async () => { app = await bootTestApp('platform'); rocks = await app.models.Rock.findAll({ order: [['id', 'ASC']] }); adminToken = await app.adminToken() })
test.after(async () => { await app.close() })
const guest = async () => (await app.request('POST', '/api/guest/session')).body.token
const recognize = (credentials, rock = rocks[0]) => app.request('POST', '/api/recognition', { ...credentials, body: { rockId: rock.id, confidence: 90 } })

test('progress, history and locked achievements are private to each user or guest', async () => {
  const { token } = await app.registerAndLogin('progress-owner')
  const other = await app.registerAndLogin('progress-other')
  await recognize({ token }); await recognize({ token }); await recognize({ token }, rocks[1])
  const stats = await app.request('GET', '/api/progress/me', { token })
  assert.equal(stats.status, 200)
  assert.deepEqual(stats.body, { totalRecognitions: 3, distinctRocks: 2, unlockedAchievements: 1, discoveryPercentage: 50 })
  const history = await app.request('GET', '/api/progress/me/history?limit=2&page=1', { token })
  assert.equal(history.body.total, 3); assert.equal(history.body.items.length, 2)
  assert.ok(history.body.items[0].id > history.body.items[1].id)
  assert.equal((await app.request('GET', '/api/progress/me/history', { token: other.token })).body.total, 0)
  const achievements = await app.request('GET', '/api/achievement/me', { token })
  assert.equal(achievements.body.items.find(row => row.slug === 'first-discovery').unlocked, true)
  assert.ok(achievements.body.items.find(row => row.slug === 'first-discovery').unlockedAt)
  assert.equal(achievements.body.items.find(row => row.slug === 'rock-explorer').unlocked, false)
  const guestToken = await guest()
  await recognize({ guestToken })
  assert.equal((await app.request('GET', '/api/progress/me', { guestToken })).body.totalRecognitions, 1)
  assert.equal((await app.request('GET', '/api/achievement/me', { guestToken })).body.items.filter(row => row.unlocked).length, 1)
  assert.equal((await app.request('GET', '/api/progress/me')).status, 401)
  assert.equal((await app.request('GET', '/api/progress/me/history?page=-1', { token })).status, 400)
})

test('feedback has one record per recognition, validates fields and enforces ownership', async () => {
  const { token } = await app.registerAndLogin('feedback-owner')
  const other = await app.registerAndLogin('feedback-other')
  const recognition = await recognize({ token })
  const url = `/api/recognition/${recognition.body.analysis.id}/feedback`
  assert.equal((await app.request('POST', url, { token, body: { isCorrect: 'true' } })).status, 400)
  assert.equal((await app.request('POST', url, { token, body: { isCorrect: true, comment: 'Coincide' } })).status, 201)
  assert.equal((await app.request('POST', url, { token, body: { isCorrect: false } })).status, 409)
  for (const method of ['GET', 'POST', 'PATCH']) {
    assert.equal((await app.request(method, url, { token: other.token, ...(method === 'GET' ? {} : { body: { isCorrect: false } }) })).status, 404)
  }
  assert.equal((await app.request('PATCH', url, { token, body: { comment: 'x'.repeat(2001) } })).status, 400)
  const changed = await app.request('PATCH', url, { token, body: { isCorrect: false, comment: 'Revisar', userId: 999 } })
  assert.equal(changed.status, 200); assert.equal(changed.body.isCorrect, false)
  assert.equal((await app.request('GET', url, { token })).body.comment, 'Revisar')
  const all = await app.request('GET', `/api/admin/feedback?analysisId=${recognition.body.analysis.id}`, { token: adminToken })
  assert.equal(all.body.total, 1)
})

test('migration merges counts, earliest dates, unlocks and history and prevents reuse', async () => {
  const guestToken = await guest()
  const first = await recognize({ guestToken }); await recognize({ guestToken })
  const { token } = await app.registerAndLogin('migrate-owner')
  await recognize({ token })
  const migrated = await app.request('POST', '/api/guest/migrate', { token, guestToken })
  assert.equal(migrated.status, 200)
  assert.equal(migrated.body.recognitions, 2)
  const collection = await app.request('GET', '/api/collection/me', { token })
  assert.equal(collection.body.total, 1)
  assert.equal(collection.body.items[0].recognitionCount, 3)
  assert.equal(collection.body.items[0].firstDiscoveredAt, first.body.collection.firstDiscoveredAt)
  assert.equal((await app.request('GET', '/api/progress/me', { token })).body.totalRecognitions, 3)
  assert.equal((await app.request('GET', '/api/achievement/me', { token })).body.items.filter(row => row.unlocked).length, 1)
  assert.equal((await recognize({ guestToken })).status, 401)
  assert.equal((await app.request('GET', '/api/guest/session', { guestToken })).status, 401)
  const other = await app.registerAndLogin('migrate-other')
  assert.equal((await app.request('POST', '/api/guest/migrate', { token: other.token, guestToken })).status, 409)
  assert.equal((await app.request('GET', '/api/collection/me', { token: other.token })).body.total, 0)
})

test('registration and migration commit together and invalid tokens roll back account creation', async () => {
  const guestToken = await guest(); await recognize({ guestToken })
  const response = await app.request('POST', '/api/user/registro', { body: { userName: 'new-from-guest', email: 'new-from-guest@example.test', password: 'Password123!', guestToken } })
  assert.equal(response.status, 201); assert.equal(response.body.migration.status, 'transferred')
  const token = await app.login('new-from-guest@example.test', 'Password123!')
  assert.equal((await app.request('GET', '/api/progress/me', { token })).body.distinctRocks, 1)
  assert.equal((await app.request('POST', '/api/user/registro', { body: { userName: 'rollback-user', email: 'rollback@example.test', password: 'Password123!', guestToken: 'invalid' } })).status, 401)
  assert.equal(await app.models.User.count({ where: { userName: 'rollback-user' } }), 0)
})

test('concurrent guest migration has one winner and quota cannot exceed ten', async () => {
  const guestToken = await guest()
  for (let i = 0; i < 9; i++) assert.equal((await recognize({ guestToken })).status, 201)
  const attempts = await Promise.all([recognize({ guestToken }), recognize({ guestToken })])
  assert.deepEqual(attempts.map(row => row.status).sort(), [201, 403])
  const a = await app.registerAndLogin('race-a'), b = await app.registerAndLogin('race-b')
  const transfers = await Promise.all([a, b].map(user => app.request('POST', '/api/guest/migrate', { token: user.token, guestToken })))
  assert.deepEqual(transfers.map(row => row.status).sort(), [200, 409])
  const totals = await Promise.all([a, b].map(user => app.request('GET', '/api/progress/me', { token: user.token })))
  assert.deepEqual(totals.map(row => row.body.totalRecognitions).sort((a, b) => a - b), [0, 10])
})

test('admin functions enforce roles, filters, account state and self protection', async () => {
  const user = await app.registerAndLogin('managed-user')
  const id = user.registration.body.user.id
  const urls = ['/api/admin/stats', '/api/admin/recognitions', '/api/admin/feedback', `/api/admin/users/${id}/collection`, `/api/admin/users/${id}/achievements`]
  for (const url of urls) {
    assert.equal((await app.request('GET', url)).status, 401)
    assert.equal((await app.request('GET', url, { token: user.token })).status, 403)
    assert.equal((await app.request('GET', url, { token: adminToken })).status, 200)
  }
  assert.equal((await app.request('GET', '/api/admin/users/999999/collection', { token: adminToken })).status, 404)
  assert.equal((await app.request('GET', '/api/admin/recognitions?userId=abc', { token: adminToken })).status, 400)
  const admin = (await app.request('GET', '/api/user/me', { token: adminToken })).body
  const role = await app.models.Role.findOne({ where: { name: 'Usuario autenticado' } })
  for (const body of [{ status: 'blocked' }, { roleId: role.id }]) assert.equal((await app.request('PATCH', `/api/admin/users/${admin.id}`, { token: adminToken, body })).status, 409)
  assert.equal((await app.request('PATCH', `/api/admin/users/${id}`, { token: adminToken, body: { roleId: 999999 } })).status, 400)
  assert.equal((await app.request('PATCH', `/api/admin/users/${id}`, { token: adminToken, body: { status: 'blocked' } })).status, 200)
  assert.equal((await app.request('GET', '/api/user/me', { token: user.token })).status, 401)
  assert.equal((await app.request('POST', '/api/user/login', { body: { email: user.email, password: 'Password123!' } })).status, 403)
  const stats = await app.request('GET', '/api/admin/stats', { token: adminToken })
  assert.equal(stats.body.totalRecognitions, await app.models.Analysis.count())
  assert.equal(stats.body.registeredUsers, await app.models.User.count())
  assert.ok(stats.body.mostRecognizedRocks.length <= 5)
})

test('discovery percentage is zero with an empty catalog and bounded after catalog changes', async () => {
  const { token } = await app.registerAndLogin('empty-catalog')
  await recognize({ token })
  try {
    await app.models.Rock.destroy({ where: {} })
    assert.equal((await app.request('GET', '/api/progress/me', { token })).body.discoveryPercentage, 0)
    await rocks[1].restore()
    const stats = await app.request('GET', '/api/progress/me', { token })
    assert.equal(stats.body.distinctRocks, 1)
    assert.equal(stats.body.discoveryPercentage, 0)
  } finally { await app.models.Rock.restore({ where: {} }) }
})

test('composite achievement API addresses both keys without affecting another owner', async () => {
  const a = await app.registerAndLogin('composite-a'), b = await app.registerAndLogin('composite-b')
  await recognize({ token: a.token }); await recognize({ token: b.token })
  const achievement = await app.models.Achievement.findOne({ where: { slug: 'first-discovery' } })
  const url = `/api/user-achievement/${a.registration.body.user.id}/${achievement.id}`
  assert.equal((await app.request('GET', url, { token: adminToken })).status, 200)
  assert.equal((await app.request('DELETE', url, { token: adminToken })).status, 204)
  assert.ok(await app.models.UserAchievement.findOne({ where: { userId: b.registration.body.user.id, achievementId: achievement.id } }))
})
