// This middleware protects every web route mounted after it.
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  const nextUrl = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?next=${nextUrl}`);
}

module.exports = requireAuth;