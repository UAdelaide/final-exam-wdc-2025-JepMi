const express = require('express');
const path = require('path');
require('dotenv').config();
const mysql = require('mysql2/promise');
const session = require('express-session');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));
app.use(session({
  secret: 'your_secret_key', // Not the most secure secret, but okay for now
  resave: false,
  saveUninitialized: false
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// MySQL Connection
let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });
    console.log('✅ Connected to database');
  } catch (err) {
    console.error('❌ DB connection error:', err.message);
  }
})();

// POST /login – handles form login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.execute(
      'SELECT * FROM Users WHERE username = ? AND password_hash = ?',
      [username, password] // ⚠️ assuming plaintext for now
    );

    if (users.length > 0) {
      const user = users[0];

      // store basic user info in session
      req.session.user = {
        id: user.user_id,
        username: user.username,
        role: user.role
      };

      // Redirect based on role
      if (user.role === 'owner') {
        return res.redirect('/owner-dashboard.html');
      } else if (user.role === 'walker') {
        return res.redirect('/walker-dashboard.html');
      } else {
        return res.send('Unrecognized role');
      }
    } else {
      res.send('❌ Invalid username or password');
    }
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).send('Something broke');
  }
});

// POST /logout – ends session and redirects
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log('Logout error:', err);
      res.redirect('/');
    } else {
      res.clearCookie('connect.sid');
      res.redirect('/');
    }
  });
});

module.exports = app;
