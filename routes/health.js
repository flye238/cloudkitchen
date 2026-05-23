const express = require('express');
const router  = express.Router();
const { getPool } = require('../db/postgres');

router.get('/', async (req, res) => {
  const health = {
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
    services:  { app: 'healthy', postgres: 'unknown' },
  };

  try {
    await getPool().query('SELECT 1');
    health.services.postgres = 'healthy';
  } catch {
    health.services.postgres = 'unavailable';
  }

  res.status(health.services.postgres === 'unavailable' ? 207 : 200).json(health);
});

module.exports = router;
