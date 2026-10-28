export function validateRequest(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      // Replace body with parsed and sanitized data (stripping unauthorized fields)
      req.body = parsed;
      next();
    } catch (error) {
      if (error.errors) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid input data',
          errors: validationErrors,
        });
      }
      next(error);
    }
  };
}

export default validateRequest;
