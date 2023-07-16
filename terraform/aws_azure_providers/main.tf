terraform {
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
      version = "~>2.0"
    }
  }
}

provider "azurerm" {
  # features {}
  # tenant_id       = var.tenant_id
  # subscription_id = var.subscription_id
  # client_id = var.client_id
  # client_secret = var.client_secret
}


provider "aws" {
  # region = "eu-west-1"
  # access_key="${var.access_key}"
  # secret_key="${var.secret_key}"
  # token="${var.token}"
}
