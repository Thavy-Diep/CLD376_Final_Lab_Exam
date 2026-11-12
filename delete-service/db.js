const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root123',
  database: process.env.DB_NAME || 'college',
  waitForConnections: true,
  connectionLimit: 10,
});

// Retry until MySQL is ready (important in Kubernetes)
async function initDb(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS students (
        Student_id INT AUTO_INCREMENT PRIMARY KEY,
        Student_name VARCHAR(100) NOT NULL,
        student_mobile VARCHAR(20) NOT NULL,
        student_email VARCHAR(100) NOT NULL UNIQUE,
        student_password VARCHAR(255) NOT NULL
      )`);
      console.log('Database ready');
      return;
    } catch (e) {
      console.log(`Waiting for database... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error('Could not connect to database');
}

module.exports = { pool, initDb };
