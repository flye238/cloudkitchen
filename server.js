require('dotenv').config();
const express = require('express');
const path    = require('path');
const { initPostgres } = require('./db/postgres');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/recipes',   require('./routes/recipes'));
app.use('/api/mealplans', require('./routes/mealplans'));
app.use('/health',        require('./routes/health'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  await initPostgres();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CloudKitchen running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error('Startup error:', err);
  process.exit(1);
});
