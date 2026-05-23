const { Pool } = require('pg');
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST, database: process.env.POSTGRES_DB || 'kitchendb',
      user: process.env.POSTGRES_USER, password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      ssl: { rejectUnauthorized: false }, max: 5,
    });
  }
  return pool;
}

module.exports = async function (context, req) {
  const { recipes, customerEmail, weekOf } = req.body || {};
  if (!recipes || !Array.isArray(recipes) || !recipes.length) {
    context.res = { status: 400, body: JSON.stringify({ error: 'Cookbook is empty' }) };
    return;
  }
  try {
    const result = await getPool().query(
      `INSERT INTO meal_plans (recipes, customer_email, week_of, status)
       VALUES ($1::jsonb, $2, $3, 'saved') RETURNING id, status, created_at`,
      [JSON.stringify(recipes), customerEmail || null, weekOf || null]
    );
    const plan = result.rows[0];
    context.res = {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Meal plan saved!', planId: plan.id, status: plan.status, savedAt: plan.created_at }),
    };
  } catch (err) {
    context.log.error('[SaveMealPlan] error:', err.message);
    context.res = { status: 500, body: JSON.stringify({ error: 'Failed to save meal plan' }) };
  }
};
