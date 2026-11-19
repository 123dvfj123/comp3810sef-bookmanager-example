const { findUser } = require('../config/users');

exports.showLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect('/books');
  }

  return res.render('login', {
    title: 'Login',
    errors: [],
    username: '',
  });
};

exports.login = (req, res) => {
  const body = req.body || {};
  const { username, password } = body;
  const user = findUser(username, password);

  if (!user) {
    return res.status(401).render('login', {
      title: 'Login',
      errors: ['Invalid username or password.'],
      username: String(username || ''),
    });
  }

  // cookie-session serialises this object into a signed browser cookie.
  // Never store the password or other sensitive data here.
  req.session.user = {
    username: user.username,
    displayName: user.displayName,
  };

  return res.redirect('/books');
};

exports.logout = (req, res) => {
  req.session = null;
  res.redirect('/login');
};
