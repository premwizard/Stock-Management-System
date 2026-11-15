import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Maps known PostgreSQL error codes to friendly, secure ApiError instances
 */
const mapDatabaseError = (err) => {
  // PostgreSQL 23505: Unique constraint violation (e.g. duplicate SKU)
  if (err.code === '23505') {
    const detail = err.detail || 'Unique constraint violation';
    return ApiError.conflict(`Duplicate record: ${detail}`);
  }

  // PostgreSQL 23503: Foreign key violation
  if (err.code === '23503') {
    const detail = err.detail || 'Referenced record does not exist or is constrained';
    return ApiError.badRequest(`Invalid relation: ${detail}`);
  }

  // PostgreSQL 23514: Check constraint violation (e.g. quantity >= 0)
  if (err.code === '23514') {
    return ApiError.badRequest(`Data constraint violation: ${err.constraint || 'Invalid field value'}`);
  }

  // PostgreSQL 22P02: Invalid text representation (e.g. invalid UUID format)
  if (err.code === '22P02') {
    return ApiError.badRequest('Invalid format or identifier provided');
  }

  return null;
};

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  // Check if error is a PostgreSQL database error
  if (err.code && typeof err.code === 'string') {
    const dbMapped = mapDatabaseError(err);
    if (dbMapped) {
      error = dbMapped;
    }
  }

  // Convert any remaining raw Error into ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], error.stack);
  }

  // Structured logging via Pino
  if (error.statusCode >= 500) {
    logger.error(
      {
        statusCode: error.statusCode,
        message: error.message,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        stack: error.stack
      },
      'Server-side operational or unhandled exception'
    );
  } else {
    logger.warn(
      {
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        path: req.originalUrl,
        method: req.method
      },
      'Client request error'
    );
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors?.length > 0 && { errors: error.errors }),
    ...(env.NODE_ENV === 'development' && error.statusCode >= 500 && { stack: error.stack })
  };

  return res.status(error.statusCode).json(response);
};
