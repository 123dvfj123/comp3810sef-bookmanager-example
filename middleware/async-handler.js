// Express 4 does not automatically forward rejected promises to the error
// handler. This wrapper turns an async route into a normal error-first route.
function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;