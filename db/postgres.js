const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host:     process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB       || 'kitchendb',
      user:     process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      port:     parseInt(process.env.POSTGRES_PORT || '5432'),
      ssl:      process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max:      10,
      idleTimeoutMillis:    30000,
      connectionTimeoutMillis: 5000,
    });
    pool.on('error', err => console.error('PostgreSQL pool error:', err.message));
  }
  return pool;
}

async function initPostgres() {
  try {
    await getPool().query('SELECT 1');
    await getPool().query(`
      CREATE TABLE IF NOT EXISTS meal_plans (
        id             SERIAL PRIMARY KEY,
        recipes        JSONB          NOT NULL,
        customer_email VARCHAR(255),
        week_of        DATE,
        status         VARCHAR(50)    DEFAULT 'saved',
        created_at     TIMESTAMPTZ    DEFAULT NOW()
      )
    `);
    console.log('[DB] PostgreSQL connected — schema ready');
  } catch (err) {
    console.warn('[DB] PostgreSQL unavailable:', err.message);
  }
}

module.exports = { getPool, initPostgres };
