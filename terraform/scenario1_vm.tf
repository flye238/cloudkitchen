# ── Scenario 1: Virtual Machine Scale Set ─────────────────────────────────────

resource "azurerm_public_ip" "vmss" {
  name                = "${var.prefix}-vmss-lb-pip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = var.tags
}

resource "azurerm_lb" "vmss" {
  name                = "${var.prefix}-vmss-lb"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"
  tags                = var.tags

  frontend_ip_configuration {
    name                 = "PublicIPAddress"
    public_ip_address_id = azurerm_public_ip.vmss.id
  }
}

resource "azurerm_lb_backend_address_pool" "vmss" {
  name            = "BackendPool"
  loadbalancer_id = azurerm_lb.vmss.id
}

resource "azurerm_lb_probe" "health" {
  name                = "health-probe"
  loadbalancer_id     = azurerm_lb.vmss.id
  protocol            = "Http"
  port                = 3000
  request_path        = "/health"
  interval_in_seconds = 15
  number_of_probes    = 2
}

resource "azurerm_lb_rule" "http" {
  name                           = "HTTP"
  loadbalancer_id                = azurerm_lb.vmss.id
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = 3000
  frontend_ip_configuration_name = "PublicIPAddress"
  backend_address_pool_ids       = [azurerm_lb_backend_address_pool.vmss.id]
  probe_id                       = azurerm_lb_probe.health.id
  disable_outbound_snat          = true
}

resource "azurerm_lb_outbound_rule" "vmss" {
  name                    = "OutboundRule"
  loadbalancer_id         = azurerm_lb.vmss.id
  protocol                = "All"
  backend_address_pool_id = azurerm_lb_backend_address_pool.vmss.id
  frontend_ip_configuration { name = "PublicIPAddress" }
}

resource "azurerm_linux_virtual_machine_scale_set" "main" {
  name                = "${var.prefix}-vmss"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Standard_B2s"
  instances           = 1
  admin_username      = "azureuser"
  upgrade_mode        = "Manual"

  admin_ssh_key {
    username   = "azureuser"
    public_key = var.ssh_public_key
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  os_disk {
    storage_account_type = "Standard_LRS"
    caching              = "ReadWrite"
  }

  network_interface {
    name    = "primary"
    primary = true
    ip_configuration {
      name                                   = "primary"
      primary                                = true
      subnet_id                              = azurerm_subnet.app.id
      load_balancer_backend_address_pool_ids = [azurerm_lb_backend_address_pool.vmss.id]
    }
  }

  custom_data = base64encode(templatefile("${path.module}/cloud-init.yaml.tftpl", {
    repo_url          = local.repo_url
    blob_base_url     = local.blob_base_url
    cosmos_endpoint   = azurerm_cosmosdb_account.main.endpoint
    cosmos_key        = azurerm_cosmosdb_account.main.primary_key
    cosmos_db         = azurerm_cosmosdb_sql_database.main.name
    cosmos_container  = azurerm_cosmosdb_sql_container.recipes.name
    postgres_host     = azurerm_postgresql_flexible_server.main.fqdn
    postgres_db       = azurerm_postgresql_flexible_server_database.kitchendb.name
    postgres_user     = var.postgres_admin_user
    postgres_password = var.postgres_admin_password
  }))

  tags = var.tags

  depends_on = [
    azurerm_lb_outbound_rule.vmss,
    azurerm_postgresql_flexible_server_database.kitchendb,
  ]
}

resource "azurerm_monitor_autoscale_setting" "vmss" {
  name                = "${var.prefix}-autoscale"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  target_resource_id  = azurerm_linux_virtual_machine_scale_set.main.id
  tags                = var.tags

  profile {
    name = "defaultProfile"

    capacity {
      default = 1
      minimum = 1
      maximum = 5
    }

    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.main.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 70
      }
      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.main.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 30
      }
      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }
}
