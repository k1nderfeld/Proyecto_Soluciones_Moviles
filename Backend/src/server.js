const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()

const db = require('./config/database')
const User = require('./models/user')
const RevokedToken = require('./models/revokedToken')
const errorHandler = require('./middlewares/errorHandler')
const notFound = require('./middlewares/notFound')

class Server {
    constructor() {
        this.app = express()
        this.port = process.env.PORT || 3000

        this.paths = {
            auth: '/api/auth'
        }

        this.middlewares()
        this.routes()
    }

    async connectDatabase() {
        await db.authenticate()
        console.log('Base de datos conectada exitosamente.')

        await User.sync()
        await RevokedToken.sync()
        console.log('Modelos sincronizados con la base de datos.')
    }

    middlewares() {
        this.app.use(morgan('dev'))
        this.app.use(cors())
        this.app.use(express.json())
    }

    routes() {
        this.app.use(this.paths.auth, require('./routes/auth.routes'))
        this.app.use(notFound)
        this.app.use(errorHandler)
    }

    async listen() {
        await this.connectDatabase()

        this.app.listen(this.port, () => {
            console.log(`El servidor se esta ejecutando en la url: http://localhost:${this.port}`)
        })
    }
}

module.exports = Server
