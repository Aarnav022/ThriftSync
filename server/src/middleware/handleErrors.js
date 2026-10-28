export function handleErrors(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with that ${field} already exists`;
  }

  // Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // In production, log internal 500 errors only to server console, and return safe generic message
  if (statusCode >= 500) {
    console.error(`[Server Error] ${statusCode} - ${err.message}`, err.stack);
    if (isProduction) {
      message = 'An unexpected internal server error occurred.';
    }
  }

  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
    ...(!isProduction && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

export default handleErrors;
