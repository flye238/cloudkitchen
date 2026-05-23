variable "prefix" {
  description = "Short prefix for all resource names"
  type        = string
  default     = "cloudkitchen"
  validation {
    condition     = length(var.prefix) <= 12 && can(regex("^[a-z][a-z0-9]*$", var.prefix))
    error_message = "Prefix must be lowercase alphanumeric, start with a letter, max 12 chars."
  }
}

variable "resource_group_name" {
  description = "Azure resource group name"
  type        = string
  default     = "cloudkitchen-rg"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "postgres_admin_user" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "kitchenadmin"
}

variable "postgres_admin_password" {
  description = "PostgreSQL admin password (min 8 chars, mixed case + number + symbol)"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.postgres_admin_password) >= 8
    error_message = "Password must be at least 8 characters."
  }
}

variable "ssh_public_key" {
  description = "SSH public key for VMSS instances (contents of ~/.ssh/id_rsa.pub)"
  type        = string
}

variable "tags" {
  description = "Tags applied to all resources"
  type        = map(string)
  default = {
    project     = "cloudkitchen"
    environment = "class"
    managed_by  = "terraform"
  }
}
