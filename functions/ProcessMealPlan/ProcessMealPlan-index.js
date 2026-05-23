/**
 * ProcessMealPlan — extra credit serverless service (Scenario 3)
 * Route: POST /api/process-mealplan
 *
 * Simulates downstream processing after a meal plan is saved:
 * generates a shopping list by aggregating ingredients from Cosmos DB recipes.
 *
 * Communication flow:
 *   SaveMealPlan → (triggers) → ProcessMealPlan → Cosmos DB (reads ingredients)
 *                                               → returns aggregated shopping list
 */
const { CosmosClient } = require('@azure/cosmos');
let _container;

async function getContainer() {
  if (_container) return _container;
  const client = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
  const { database }  = await client.databases.createIfNotExists({ id: process.env.COSMOS_DB_NAME || 'kitchendb' });
  const { container } = await database.containers.createIfNotExists({
    id: process.env.COSMOS_CONTAINER_NAME || 'recipes',
    partitionKey: { paths: ['/cuisine'] },
  });
  _container = container;
  return _container;
}

module.exports = async function (context, req) {
  const { planId, recipes } = req.body || {};

  if (!planId || !Array.isArray(recipes)) {
    context.res = { status: 400, body: JSON.stringify({ error: 'planId and recipes are required' }) };
    return;
  }

  const container    = await getContainer();
  const shoppingList = [];

  for (const item of recipes) {
    try {
      const { resources } = await container.items
        .query({ query: 'SELECT c.name, c.ingredients FROM c WHERE c.id = @id', parameters: [{ name: '@id', value: item.recipeId }] })
        .fetchAll();

      if (resources.length && resources[0].ingredients) {
        shoppingList.push({
          recipe:      resources[0].name,
          ingredients: resources[0].ingredients,
        });
      }
    } catch (err) {
      context.log.error(`[ProcessMealPlan] error for ${item.recipeId}:`, err.message);
    }
  }

  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      message:      `Meal plan ${planId} processed`,
      shoppingList,
    }),
  };
};
