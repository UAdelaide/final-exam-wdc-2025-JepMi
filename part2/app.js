const express = require('express');
const path = require('path');
require('dotenv').config();
const mysql = require('mysql2/promise'); // Add this to use MySQL
const session = require('express-session'); // Add this for login sessions


const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;