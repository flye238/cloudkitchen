# ── Scenario 2: Azure Container Apps ──────────────────────────────────────────

resource "azurerm_container_registry" "main" {
  name                = "${var.prefix}acr${local.suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = var.tags
}

resource "azurerm_container_app_environment" "main" {
  name                = "${var.prefix}-container-env"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = var.tags
}

# STEP 1: Apply everything up to here first:
#   terraform apply -target=azurerm_container_registry.main
#
# STEP 2: Build and push image:
#   az acr build --registry <acr-name> --image cloudkitchen:latest https://github.com/flye238/cloudkitchen.git
#
# STEP 3: Uncomment below and run terraform apply again

# resource "azurerm_container_app" "main" {
#   name                         = "${var.prefix}-app"
#   container_app_environment_id = azurerm_container_app_environment.main.id
#   resource_group_name          = azurerm_resource_group.main.name
#   revision_mode                = "Single"
#   tags                         = var.tags
#
#   registry {
#     server               = azurerm_container_registry.main.login_server
#     username             = azurerm_container_registry.main.admin_username
#     password_secret_name = "acr-password"
#   }
#
#   secret {
#     name  = "acr-password"
#     value = azurerm_container_registry.main.admin_password
#   }
#   secret {
#     name  = "cosmos-key"
#     value = azurerm_cosmosdb_account.main.primary_key
#   }
#   secret {
#     name  = "pg-password"
#     value = var.postgres_admin_password
#   }
#
#   template {
#     min_replicas = 1
#     max_replicas = 5
#
#     container {
#       name   = "cloudkitchen"
#       image  = "${azurerm_container_registry.main.login_server}/cloudkitchen:latest"
#       cpu    = 0.5
#       memory = "1Gi"
#
#       env { name = "BLOB_STORAGE_BASE_URL"; value = local.blob_base_url }
#       env { name = "COSMOS_ENDPOINT";       value = azurerm_cosmosdb_account.main.endpoint }
#       env { name = "COSMOS_DB_NAME";        value = azurerm_cosmosdb_sql_database.main.name }
#       env { name = "COSMOS_CONTAINER_NAME"; value = azurerm_cosmosdb_sql_container.recipes.name }
#       env { name = "POSTGRES_HOST";         value = azurerm_postgresql_flexible_server.main.fqdn }
#       env { name = "POSTGRES_DB";           value = azurerm_postgresql_flexible_server_database.kitchendb.name }
#       env { name = "POSTGRES_USER";         value = var.postgres_admin_user }
#       env { name = "POSTGRES_SSL";          value = "true" }
#       env { name = "COSMOS_KEY";            secret_name = "cosmos-key" }
#       env { name = "POSTGRES_PASSWORD";     secret_name = "pg-password" }
#
#       liveness_probe {
#         transport               = "HTTP"
#         path                    = "/health"
#         port                    = 3000
#         initial_delay           = 10
#         interval_seconds        = 30
#         failure_count_threshold = 3
#       }
#
#       readiness_probe {
#         transport               = "HTTP"
#         path                    = "/health"
#         port                    = 3000
#         interval_seconds        = 10
#         failure_count_threshold = 3
#       }
#     }
#
#     http_scale_rule {
#       name                = "http-scaling"
#       concurrent_requests = "10"
#     }
#   }
#
#   ingress {
#     external_enabled = true
#     target_port      = 3000
#     transport        = "auto"
#     traffic_weight {
#       percentage      = 100
#       latest_revision = true
#     }
#   }
# }
