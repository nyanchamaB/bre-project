class ErrorResponse extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  
  const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
  
    // Log error for debugging
    console.error('Error:', err);
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message).join(', ');
      error = new ErrorResponse(message, 400);
    }
  
    // Mongoose duplicate key error
    if (err.code === 11000) {
      const message = 'Duplicate field value entered';
      error = new ErrorResponse(message, 400);
    }
  
    // Mongoose cast error
    if (err.name === 'CastError') {
      const message = 'Resource not found';
      error = new ErrorResponse(message, 404);
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      const message = 'Invalid token';
      error = new ErrorResponse(message, 401);
    }
  
    // Token expired error
    if (err.name === 'TokenExpiredError') {
      const message = 'Token expired';
      error = new ErrorResponse(message, 401);
    }
  
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Server Error'
    });
  };
  
  export default errorHandler;