export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error description
   * @param {Array} [errors] - Specific field validation or operational error items
   * @param {string} [stack] - Optional stack trace override
   */
  constructor(statusCode, message = 'An unexpected error occurred', errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource Not Found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource Conflict') {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Unprocessable Entity', errors = []) {
    return new ApiError(422, message, errors);
  }

  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message);
  }
}

