// This middleware protects every web route mounted after it.
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  return res.redirect('/login');
}

module.exports = requireAuth;
