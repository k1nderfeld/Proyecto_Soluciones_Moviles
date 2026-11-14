const { DataTypes, Model } = require('sequelize')
const bcrypt = require('bcryptjs')
const db = require('../config/database')

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10

class User extends Model {}

User.init({
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false
    },

    name: {
        type: DataTypes.STRING,
        allowNull: false
    },

    alias: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },

    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },

    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: { isEmail: true },
        set(value) {
            this.setDataValue('email', value ? value.trim().toLowerCase() : null)
        }
    },

    password: {
        type: DataTypes.STRING,
        allowNull: true
    },

    role: {
        type: DataTypes.ENUM('pasajero', 'conductor', 'admin'),
        allowNull: false,
        defaultValue: 'pasajero'
    },

    authProvider: {
        type: DataTypes.ENUM('local', 'google', 'apple'),
        allowNull: false,
        defaultValue: 'local'
    },

    googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },

    appleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },

    photoUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },

    status: {
        type: DataTypes.ENUM('pending', 'active', 'disabled'),
        allowNull: false,
        defaultValue: 'pending'
    },

    emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    phoneVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },

    emailVerificationExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },

    phoneVerificationCode: {
        type: DataTypes.STRING,
        allowNull: true
    },

    phoneVerificationExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },

    termsAcceptedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },

    twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },

    twoFactorSecret: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize: db,
    modelName: 'User',
    tableName: 'user',
    timestamps: true,
    paranoid: true,
    hooks: {
        beforeSave: async (user) => {
            if (!user.changed('password') || !user.password) return
            if (user.password.startsWith('$2')) return
            user.password = await bcrypt.hash(user.password, SALT_ROUNDS)
        }
    }
})

User.prototype.verifyPassword = function (plainPassword) {
    if (!this.password) return Promise.resolve(false)
    return bcrypt.compare(plainPassword, this.password)
}

User.prototype.toJSON = function () {
    const values = { ...this.get() }
    delete values.password
    delete values.twoFactorSecret
    delete values.emailVerificationToken
    delete values.emailVerificationExpiresAt
    delete values.phoneVerificationCode
    delete values.phoneVerificationExpiresAt
    return values
}

module.exports = User
