import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Convert generic Error into ApiError if not already one
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], error.stack);
  }

  // Structured logging of the error
  logger.error({
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    path: req.originalUrl,
    method: req.method,
    stack: env.NODE_ENV === 'development' ? error.stack : undefined
  });

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors?.length > 0 && { errors: error.errors }),
    ...(env.NODE_ENV === 'development' && { stack: error.stack })
  };

  return res.status(error.statusCode).json(response);
};

