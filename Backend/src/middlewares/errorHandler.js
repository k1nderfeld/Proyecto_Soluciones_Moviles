const errorHandler = (err, req, res, next) => {
    let status = err.status || 500
    let message = err.message

    if (err.name === 'SequelizeUniqueConstraintError') {
        status = 409
        message = 'Ya existe una cuenta con los datos ingresados'
    } else if (err.name === 'SequelizeValidationError') {
        status = 400
        message = 'Los datos ingresados son incorrectos'
    } else if (!err.status) {
        message = 'Ocurrió un error inesperado. Intenta nuevamente.'
    }

    return res.status(status).json({
        success: false,
        message
    })
}

module.exports = errorHandler
