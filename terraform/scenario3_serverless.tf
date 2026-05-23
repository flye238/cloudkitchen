# ── Scenario 3: Azure Functions + Blob Static Website ─────────────────────────

resource "azurerm_storage_account" "functions" {
  name                     = "${var.prefix}fn${local.suffix}sa"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  tags                     = var.tags
}

resource "azurerm_service_plan" "functions" {
  name                = "${var.prefix}-fn-plan"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "Y1"
  tags                = var.tags
}

resource "azurerm_linux_function_app" "main" {
  name                = "${var.prefix}-fn-${local.suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  storage_account_name       = azurerm_storage_account.functions.name
  storage_account_access_key = azurerm_storage_account.functions.primary_access_key
  service_plan_id            = azurerm_service_plan.functions.id

  site_config {
    application_stack { node_version = "18" }
    cors {
      allowed_origins     = [azurerm_storage_account.main.primary_web_endpoint]
      support_credentials = false
    }
  }

  app_settings = {
    FUNCTIONS_WORKER_RUNTIME = "node"
    WEBSITE_RUN_FROM_PACKAGE = "1"
    BLOB_STORAGE_BASE_URL    = local.blob_base_url
    COSMOS_ENDPOINT          = azurerm_cosmosdb_account.main.endpoint
    COSMOS_KEY               = azurerm_cosmosdb_account.main.primary_key
    COSMOS_DB_NAME           = azurerm_cosmosdb_sql_database.main.name
    COSMOS_CONTAINER_NAME    = azurerm_cosmosdb_sql_container.recipes.name
    POSTGRES_HOST            = azurerm_postgresql_flexible_server.main.fqdn
    POSTGRES_DB              = azurerm_postgresql_flexible_server_database.kitchendb.name
    POSTGRES_USER            = var.postgres_admin_user
    POSTGRES_PASSWORD        = var.postgres_admin_password
    POSTGRES_SSL             = "true"
  }

  tags = var.tags
}

# Deploy Functions code after terraform apply:
#   Compress-Archive -Path .\functions\* -DestinationPath functions.zip -Force
#   az functionapp deployment source config-zip `
#     --name <function-app-name> `
#     --resource-group cloudkitchen-rg `
#     --src functions.zip
#
# Upload frontend to $web container after updating API_BASE in public/app.js:
#   Portal: Storage Account → Containers → $web → Upload (index.html, style.css, app.js)
