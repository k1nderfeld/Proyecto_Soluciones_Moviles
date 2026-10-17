const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class Feedback extends Model {}
Feedback.init({
  analysisId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  isCorrect: { type: DataTypes.BOOLEAN, allowNull: false },
  comment: { type: DataTypes.STRING(2000), allowNull: true, validate: { len: [0, 2000] } }
}, { sequelize: db, modelName: 'Feedback', tableName: 'feedback', timestamps: true })
Feedback.associate = models => {
  Feedback.belongsTo(models.Analysis, { foreignKey: 'analysisId', as: 'analysis' })
  Feedback.belongsTo(models.User, { foreignKey: 'userId', as: 'user' })
}
module.exports = Feedback
