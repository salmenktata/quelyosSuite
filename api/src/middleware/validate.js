const { z } = require('zod');
const logger = require('../../logger');

/**
 * Middleware de validation Zod pour les routes API
 * @param {Object} schema - Schema Zod à valider { body?, query?, params? }
 */
function validate(schema) {
  return async (req, res, next) => {
    try {
      // Valider le body si schema fourni
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Valider les query params si schema fourni
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      // Valider les params si schema fourni
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.error('Validation error', { errors, path: req.path });

        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      logger.error('Unexpected validation error', { error: error.message });
      return res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

module.exports = { validate };
