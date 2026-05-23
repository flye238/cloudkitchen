output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "blob_storage_account_name" {
  description = "Storage account name — use for image uploads"
  value       = azurerm_storage_account.main.name
}

output "blob_base_url" {
  description = "Base URL for recipe images"
  value       = local.blob_base_url
}

output "cosmos_endpoint" {
  value = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_primary_key" {
  value     = azurerm_cosmosdb_account.main.primary_key
  sensitive = true
}

output "postgres_fqdn" {
  description = "PostgreSQL FQDN (private, VNet-only)"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "vmss_load_balancer_ip" {
  description = "Scenario 1 — visit http://<ip>"
  value       = azurerm_public_ip.vmss.ip_address
}

output "acr_login_server" {
  description = "ACR login server — use for az acr build"
  value       = azurerm_container_registry.main.login_server
}

output "container_app_fqdn" {
  description = "Scenario 2 — visit https://<fqdn>"
  value       = azurerm_container_app.main.latest_revision_fqdn
}

output "function_app_name" {
  description = "Use for: az functionapp deployment source config-zip --name <this>"
  value       = azurerm_linux_function_app.main.name
}

output "function_app_api_base" {
  description = "Scenario 3 — set this as API_BASE in public/app.js"
  value       = "https://${azurerm_linux_function_app.main.default_hostname}/api"
}

output "frontend_url" {
  description = "Scenario 3 frontend — upload public/ files to $web container"
  value       = azurerm_storage_account.main.primary_web_endpoint
}

output "dot_env" {
  description = "Run: terraform output -raw dot_env > ../.env"
  sensitive   = true
  value       = <<-EOT
    BLOB_STORAGE_BASE_URL=${local.blob_base_url}
    COSMOS_ENDPOINT=${azurerm_cosmosdb_account.main.endpoint}
    COSMOS_KEY=${azurerm_cosmosdb_account.main.primary_key}
    COSMOS_DB_NAME=${azurerm_cosmosdb_sql_database.main.name}
    COSMOS_CONTAINER_NAME=${azurerm_cosmosdb_sql_container.recipes.name}
    POSTGRES_HOST=${azurerm_postgresql_flexible_server.main.fqdn}
    POSTGRES_DB=${azurerm_postgresql_flexible_server_database.kitchendb.name}
    POSTGRES_USER=${var.postgres_admin_user}
    POSTGRES_PASSWORD=${var.postgres_admin_password}
    POSTGRES_SSL=true
  EOT
}
