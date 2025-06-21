const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  socketPath: '/var/run/mysqld/mysqld.sock',
  user: 'root',
  password: 'michele123',
  database: 'DogWalkService',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;