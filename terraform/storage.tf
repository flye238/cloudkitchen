resource "azurerm_storage_account" "main" {
  name                            = "${var.prefix}${local.suffix}sa"
  resource_group_name             = azurerm_resource_group.main.name
  location                        = azurerm_resource_group.main.location
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  account_kind                    = "StorageV2"
  allow_nested_items_to_be_public = true

  # Enables $web container for Scenario 3 static frontend
  static_website {
    index_document     = "index.html"
    error_404_document = "index.html"
  }

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  tags = var.tags
}

# Public container — recipe images served directly to browsers
resource "azurerm_storage_container" "images" {
  name                  = "images"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "blob"
}

# Upload steps after terraform apply:
#   Images  → Portal: Storage Account → Containers → images → Upload
#             (carbonara.jpg, tikka.jpg, tacos.jpg, padthai.jpg, greeksalad.jpg, lavacake.jpg)
#   Frontend → Portal: Storage Account → Containers → $web → Upload
#             (public/index.html, public/style.css, public/app.js)
#             NOTE: update API_BASE in app.js before uploading for Scenario 3
