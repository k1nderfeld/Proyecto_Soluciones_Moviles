const { DataTypes, Model } = require('sequelize')
const db = require('../config/database')

class RevokedToken extends Model {}

RevokedToken.init({
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false
    },

    jti: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize: db,
    modelName: 'RevokedToken',
    tableName: 'revoked_token',
    timestamps: true
})

module.exports = RevokedToken
