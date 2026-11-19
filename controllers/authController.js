const { findUser } = require('../config/users');

// Only allow redirects to a path on this site. Reject absolute URLs and
// protocol-relative URLs such as //example.com.
function safeNext(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/books';
  }

  return value;
}

exports.showLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect('/books');
  }

  return res.render('login', {
    title: 'Login',
    errors: [],
    username: '',
    next: safeNext(req.query.next),
  });
};

exports.login = (req, res) => {
  const body = req.body || {};
  const { username, password } = body;
  const user = findUser(username, password);
  const next = safeNext(body.next);

  if (!user) {
    return res.status(401).render('login', {
      title: 'Login',
      errors: ['Invalid username or password.'],
      username: String(username || ''),
      next,
    });
  }

  // cookie-session serialises this object into a signed browser cookie.
  // Never store the password or other sensitive data here.
  req.session.user = {
    username: user.username,
    displayName: user.displayName,
  };

  return res.redirect(next);
};

exports.logout = (req, res) => {
  req.session = null;
  res.redirect('/login');
};