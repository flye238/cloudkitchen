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
  try {
    const container = await getContainer();
    const { resources } = await container.items
      .query('SELECT c.id, c.name, c.cuisine, c.prepTime, c.servings, c.description, c.imageUrl, c.ingredients FROM c')
      .fetchAll();
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(resources),
    };
  } catch (err) {
    context.log.error('[GetRecipes] error:', err.message);
    context.res = { status: 500, body: JSON.stringify({ error: 'Failed to fetch recipes' }) };
  }
};
