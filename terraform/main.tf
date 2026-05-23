terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.110" }
    random  = { source = "hashicorp/random",  version = "~> 3.6"   }
  }
}

provider "azurerm" {
  features {
    resource_group { prevent_deletion_if_contains_resources = false }
    key_vault      { purge_soft_delete_on_destroy = true }
  }
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  suffix        = random_string.suffix.result
  blob_base_url = "https://${azurerm_storage_account.main.name}.blob.core.windows.net/images"
  repo_url      = "https://github.com/flye238/cloudkitchen.git"
}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}
