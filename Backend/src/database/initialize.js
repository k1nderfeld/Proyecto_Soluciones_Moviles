require('dotenv').config()
const models = require('../models')
const { seedDemoData } = require('./seedDemoData')
const { seedAdminUser } = require('./seedAdmin')

async function initialize() {
  try {
    await models.sequelize.authenticate()
    // Add missing tables without dropping data or altering existing tables.
    await models.sequelize.sync()
    await seedDemoData(models)
    await seedAdminUser(models)
    console.log('Base de datos inicializada correctamente.')
  } finally { await models.sequelize.close() }
}
if (require.main === module) initialize().catch(error => { console.error(error.message); process.exitCode = 1 })
module.exports = { initialize }
