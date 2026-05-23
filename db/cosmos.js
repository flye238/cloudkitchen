const { CosmosClient } = require('@azure/cosmos');

let _container;

async function getContainer() {
  if (_container) return _container;

  const client = new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT,
    key:      process.env.COSMOS_KEY,
  });

  const { database }  = await client.databases.createIfNotExists({ id: process.env.COSMOS_DB_NAME || 'kitchendb' });
  const { container } = await database.containers.createIfNotExists({
    id: process.env.COSMOS_CONTAINER_NAME || 'recipes',
    partitionKey: { paths: ['/cuisine'] },
  });

  _container = container;
  console.log('[DB] Cosmos DB connected — recipes container ready');
  return _container;
}

module.exports = { getContainer };
