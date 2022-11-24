## <https://registry.terraform.io/providers/hashicorp/azurerm>
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
  # client_id = var.client_id
  # client_secret = var.client_secret
}

## <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/resource_group>
resource "azurerm_resource_group" "rg" {
  name     = "Torque-Env-RG-${var.env_id}"
  location = "westus2"
}

## <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/availability_set>
resource "azurerm_availability_set" "DemoAset" {
  name                = "env-aset"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

## <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/virtual_network>
resource "azurerm_virtual_network" "vnet" {
  name                = "Torque-Env-vnet-${var.env_id}"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

## <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet>
resource "azurerm_subnet" "subnet" {
  name                 = "Internal-subnet"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.2.0/24"]
}

resource "azurerm_public_ip" "public_ip" {
  name                = "Win2016Public-IP"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  allocation_method   = "Dynamic"
}

## <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/network_interface>
resource "azurerm_network_interface" "win-2016-nic" {
  name                = "win-2016-nic"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id = azurerm_public_ip.public_ip.id
  }
}

## <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/windows_virtual_machine>
resource "azurerm_windows_virtual_machine" "my-win2016-vm" {
  name                = var.vm_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  size                = "Standard_DS1_v2"
  admin_username      = "adminuser"
  admin_password      = "P@$$w0rd1234!"
  availability_set_id = azurerm_availability_set.DemoAset.id
  network_interface_ids = [ azurerm_network_interface.win-2016-nic.id,]
  computer_name  = "mywin2016"

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "MicrosoftWindowsServer"
    offer     = "WindowsServer"
    sku       = "2016-Datacenter"
    version   = "latest"
  }
}

## <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/network_security_group>
resource "azurerm_network_security_group" "ag_nsg" {
  name                = "Application_Gateway_Subnet_NSG"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

 security_rule {
    name                       = "Allow_AG_Management_Traffic"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3389"
    source_address_prefix      = var.source_cidr
    destination_address_prefix = "*"
  }
}


## <https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/resources/subnet_network_security_group_association>
resource "azurerm_subnet_network_security_group_association" "ag_subnet_ag_nsg_association" {
  subnet_id                 = azurerm_subnet.subnet.id
  network_security_group_id = azurerm_network_security_group.ag_nsg.id
}