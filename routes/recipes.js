const express = require('express');
const router  = express.Router();
const { getContainer } = require('../db/cosmos');

// GET /api/recipes
router.get('/', async (req, res) => {
  try {
    const container = await getContainer();
    const { resources } = await container.items
      .query('SELECT c.id, c.name, c.cuisine, c.prepTime, c.servings, c.description, c.imageUrl, c.ingredients FROM c')
      .fetchAll();
    res.json(resources);
  } catch (err) {
    console.error('[Recipes] GET / error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// GET /api/recipes/:id
router.get('/:id', async (req, res) => {
  try {
    const container = await getContainer();
    const { resources } = await container.items
      .query({
        query:      'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: req.params.id }],
      })
      .fetchAll();

    if (!resources.length) return res.status(404).json({ error: 'Recipe not found' });
    res.json(resources[0]);
  } catch (err) {
    console.error('[Recipes] GET /:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

module.exports = router;
