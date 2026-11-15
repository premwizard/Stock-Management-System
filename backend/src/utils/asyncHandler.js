/**
 * Wrapper for async express route handlers to forward errors to the central error middleware
 * @param {Function} fn - Async controller function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

