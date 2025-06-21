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
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// 🔌 Connect to MySQL
let db;
(async () => {
  db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'DogWalkService'
  });
})();

// 🔐 Login Route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.execute(
      'SELECT * FROM Users WHERE username = ? AND password_hash = ?',
      [username, password]
    );

    if (users.length > 0) {
      const user = users[0];

      req.session.user = {
        id: user.user_id,
        username: user.username,
        role: user.role
      };

      if (user.role === 'owner') {
        return res.redirect('/owner-dashboard.html');
      } if (user.role === 'walker') {
        return res.redirect('/walker-dashboard.html');
      }
    } else {
      res.send('Invalid username or password');
    }
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).send('Something went wrong');
  }
});


// Export the app instead of listening here
module.exports = app;