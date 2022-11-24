## <https://www.terraform.io/docs/providers/azurerm/index.html>
terraform {
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }
}

provider "azurerm" {
  features {}
  # tenant_id       = var.tenant_id
  # subscription_id = var.subscription_id
  # client_id =     var.client_id
  # client_secret = var.client_secret
}

data "http" "website_file" {
  url = "https://torque-prod-cfn-assets.s3.amazonaws.com/public-assets/TetrisJS.html"
}

## <https://www.terraform.io/docs/providers/azurerm/r/resource_group.html>
resource "azurerm_resource_group" "rg" {
  name     = "torques-sandbox-${var.sandbox_id}-rg"
  location = "westus2"
}

resource "azurerm_storage_account" "my_storage_account" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "GRS"

  static_website {
    index_document = "index.html"
    error_404_document = "error.html"
  }

  routing {
    publish_internet_endpoints = true
  }
}

resource "azurerm_storage_blob" "index_page" {
  name = "index.html"
  storage_account_name = azurerm_storage_account.my_storage_account.name
  storage_container_name = "$web"
  type = "Block"
  content_type = "text/html"
  source_content = data.http.website_file.response_body
}
