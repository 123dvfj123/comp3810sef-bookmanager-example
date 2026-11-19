require('dotenv').config();

const path = require('node:path');
const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');

const authRoutes = require('./routes/authRoutes');
const webBookRoutes = require('./routes/webBookRoutes');
const apiBookRoutes = require('./routes/apiBookRoutes');
const errorHandler = require('./middleware/error-handler');

const app = express();
const port = Number(process.env.PORT) || 8099;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets can be served before session parsing.
app.use(express.static(path.join(__dirname, 'public')));

// HTML forms send urlencoded data; the REST API sends JSON.
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// cookie-session stores the session object in a signed browser cookie.
// This is appropriate for the small teaching example, not large secrets.
app.use(
  cookieSession({
    name: 'bookmanager.sid',
    keys: [process.env.SESSION_SECRET || 'local-development-secret-only'],
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // Local Ubuntu testing uses http://localhost.
    maxAge: 24 * 60 * 60 * 1000,
  })
);

// Make the logged-in user available to every EJS template.
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// REST API first: it is independent of the browser login.
app.use('/api', apiBookRoutes);

// Login/logout pages and the protected server-rendered MVC pages.
app.use(authRoutes);
app.use(webBookRoutes);

app.use((req, res) => {
  res.status(404).render('not-found', {
    title: 'Page not found',
    message: 'The page you requested does not exist.',
  });
});

app.use(errorHandler);

async function start() {
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected.');

  app.listen(port, () => {
    console.log(`Book Manager running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start the application:');
  console.error(error.message);
  process.exit(1);
});