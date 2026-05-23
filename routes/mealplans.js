const express = require('express');
const router  = express.Router();
const { getPool } = require('../db/postgres');

// POST /api/mealplans — save a weekly meal plan
router.post('/', async (req, res) => {
  const { recipes, customerEmail, weekOf } = req.body;

  if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
    return res.status(400).json({ error: 'Cookbook is empty' });
  }

  try {
    const db     = getPool();
    const result = await db.query(
      `INSERT INTO meal_plans (recipes, customer_email, week_of, status)
       VALUES ($1::jsonb, $2, $3, 'saved')
       RETURNING id, status, created_at`,
      [JSON.stringify(recipes), customerEmail || null, weekOf || null]
    );

    const plan = result.rows[0];
    console.log(`[MealPlans] Meal plan #${plan.id} saved`);

    res.status(201).json({
      message:   'Meal plan saved successfully!',
      planId:    plan.id,
      status:    plan.status,
      savedAt:   plan.created_at,
    });
  } catch (err) {
    console.error('[MealPlans] POST / error:', err.message);
    res.status(500).json({ error: 'Failed to save meal plan' });
  }
});

// GET /api/mealplans — view last 20 saved plans
router.get('/', async (req, res) => {
  try {
    const db     = getPool();
    const result = await db.query(
      'SELECT id, recipes, customer_email, week_of, status, created_at FROM meal_plans ORDER BY created_at DESC LIMIT 20'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[MealPlans] GET / error:', err.message);
    res.status(500).json({ error: 'Failed to fetch meal plans' });
  }
});

module.exports = router;
