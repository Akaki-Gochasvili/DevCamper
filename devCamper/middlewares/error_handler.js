const ErrorResponse = require('../utils/error_response');
const chalk = require('chalk')

// ========== Error Handler Middleware ========== //
const errorHandler = (error, request, response, next) => {
    let errorVariable = { ...error }

    errorVariable.message = error.message

    console.error(chalk.red.bold(error))

    // ========== Mongoose Bad ObjectId ========== //

    if (error.name === 'CastError') {
        const message = `Resource not found in Mongo Database`

        errorVariable = new ErrorResponse(message, 404)
    }

    // ========== Mongoose Duplicate Key ========== //

    if (error.code === 11000) {
        const message = 'Duplicate field value entered'

        errorVariable = new ErrorResponse(message, 400)
    }

    // ========== Mongoose Validation Error ========== //
    
    if (error.name === 'ValidationError') {
        const message = Object.values(error.errors).map(val => val.message)
        
        errorVariable = new ErrorResponse(message, 400)
    }
    
    // ========== Syntax Error ========== //

    if (error.name === 'SyntaxError') {
        const message = error.message

        errorVariable = new ErrorResponse(message, 400)
    }

    response.status(errorVariable.statusCode || 500).json({
        success: false,
        error: errorVariable.message || 'Server Error'
    })
}

module.exports = errorHandler;
