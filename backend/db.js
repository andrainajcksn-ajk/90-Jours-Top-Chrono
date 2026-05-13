const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      start_time BIGINT,
      tasks_locked INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'exercice',
      status TEXT DEFAULT 'pending',
      last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_reports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      report_date TEXT NOT NULL,
      task_id INTEGER NOT NULL REFERENCES tasks(id),
      task_title TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      UNIQUE(user_id, report_date, task_id)
    );
  `);
  console.log('✅ Base de données PostgreSQL prête');
}

initDB().catch(console.error);

module.exports = pool;