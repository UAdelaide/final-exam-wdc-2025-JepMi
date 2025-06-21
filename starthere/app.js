var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '' // Set your MySQL root password
    });

    // Create the database if it doesn't exist
    await connection.query('CREATE DATABASE IF NOT EXISTS testdb');
    await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'testdb'
    });

    // Create a table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS books (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        author VARCHAR(255)
      )
    `);

    // Insert data if table is empty
    const [rows] = await db.execute('SELECT COUNT(*) AS count FROM books');
    if (rows[0].count === 0) {
      await db.execute(`
        INSERT INTO books (title, author) VALUES
        ('1984', 'George Orwell'),
        ('To Kill a Mockingbird', 'Harper Lee'),
        ('Brave New World', 'Aldous Huxley')
      `);
    }
  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

// Route to return books as JSON
app.get('/', async (req, res) => {
  try {
    const [books] = await db.execute('SELECT * FROM books');
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, 'public')));

// Get all dogs - TODO: add pagination later
app.get('/api/dogs', async (req, res) => {
  try {
    const [results] = await db.execute(`
      SELECT
        Dogs.name AS dog_name,
        Dogs.size,
        Users.username AS owner_username
      FROM Dogs
      INNER JOIN Users ON Dogs.owner_id = Users.user_id
    `);
    res.json(results);
  } catch (error) {
    console.error("Dogs query failed:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Open walk requests
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [openWalks] = await db.execute(`
      SELECT
        WalkRequests.request_id,
        Dogs.name AS dog_name,
        WalkRequests.requested_time,
        WalkRequests.duration_minutes,
        WalkRequests.location,
        Users.username AS owner_username
      FROM WalkRequests
      JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
      JOIN Users ON Dogs.owner_id = Users.user_id
      WHERE WalkRequests.status = 'open'
      ORDER BY WalkRequests.requested_time
    `);

    res.json(openWalks);
  } catch (err) {
    console.error("Error getting open walks:", err);
    return res.status(500).json({ error: "Could not fetch walk requests" });
  }
});

// Walker stats endpoint
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [walkerStats] = await db.execute(`
      SELECT
        u.username AS walker_username,
        COUNT(r.rating_id) AS total_ratings,
        ROUND(AVG(r.rating), 1) AS avg_rating,
        COUNT(CASE WHEN wr.status = 'completed' THEN 1 END) AS walks_completed
      FROM Users u
      LEFT JOIN WalkApplications wa ON u.user_id = wa.walker_id
      LEFT JOIN WalkRequests wr ON wa.request_id = wr.request_id
      LEFT JOIN Ratings r ON wa.application_id = r.application_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id, u.username
    `);

    res.json(walkerStats);
  } catch (error) {
    console.error("Walker summary query error:", error);
    res.status(500).json({ error: "Failed to get walker data" });
  }
});

module.exports = app;



module.exports = app;
