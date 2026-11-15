import { ApiError } from '../utils/ApiError.js';

/**
 * Generic request validator middleware using Zod schemas
 * Can validate body, query, and params
 * @param {import('zod').ZodSchema} schema - Zod schema object
 * @param {'body' | 'query' | 'params' | 'all'} [source='body'] - Request segment to validate
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      if (source === 'all') {
        const validated = schema.parse({
          body: req.body,
          query: req.query,
          params: req.params
        });
        req.body = validated.body ?? req.body;
        req.query = validated.query ?? req.query;
        req.params = validated.params ?? req.params;
      } else {
        const validated = schema.parse(req[source]);
        req[source] = validated;
      }
      return next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          rule: e.code
        }));
        return next(ApiError.badRequest('Validation error', formattedErrors));
      }
      return next(err);
    }
  };
};

