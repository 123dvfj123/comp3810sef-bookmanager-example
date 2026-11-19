// Central error handling keeps controllers focused on normal behaviour.
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const isValidationError = error.name === 'ValidationError';
  const isCastError = error.name === 'CastError';
  const status =
    error.status || (isValidationError || isCastError ? 400 : 500);

  if (status >= 500) {
    console.error(error);
  }

  if (req.originalUrl.startsWith('/api')) {
    const payload = {
      error:
        status >= 500
          ? 'Internal server error.'
          : isValidationError
            ? 'Validation failed.'
            : error.message,
    };

    if (isValidationError) {
      payload.details = Object.values(error.errors).map((item) => item.message);
    }

    return res.status(status).json(payload);
  }

  return res.status(status).render('error', {
    title: 'Error',
    status,
    message:
      status >= 500
        ? 'Something went wrong while processing your request.'
        : error.message,
  });
}

module.exports = errorHandler;