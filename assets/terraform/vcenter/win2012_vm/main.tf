terraform {
  required_providers {
    vsphere = {
      source = "hashicorp/vsphere"
      version = "~>2.0"
    }
  }
}

provider "vsphere" {
  user           = var.vc_username
  password       = var.vc_password
  vsphere_server = var.vc_address
  # If you have a self-signed cert
  allow_unverified_ssl = true
}


# data
data "vsphere_datacenter" "dc" {
  name = var.vc_dc_name
}

data "vsphere_datastore" "ds" {
  name          = var.vc_ds_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_virtual_machine" "win2012-template" {
  name          = "Win-2012R2-Template"
  datacenter_id = data.vsphere_datacenter.dc.id
}

locals {
  env_id = reverse(split("/", var.vm_folder_path))[0]
}

# resources
resource "vsphere_virtual_machine" "win-vm" {
  name              = "Win2012R2 - ${local.env_id}"
  folder            = var.vm_folder_path
  datastore_id      = data.vsphere_datastore.ds.id
  resource_pool_id  = var.resource_pool_id
  num_cpus          = data.vsphere_virtual_machine.win2012-template.num_cpus
  memory            = data.vsphere_virtual_machine.win2012-template.memory
  guest_id          = data.vsphere_virtual_machine.win2012-template.guest_id
  scsi_type         = data.vsphere_virtual_machine.win2012-template.scsi_type
  efi_secure_boot_enabled = data.vsphere_virtual_machine.win2012-template.efi_secure_boot_enabled
  firmware = data.vsphere_virtual_machine.win2012-template.firmware
  wait_for_guest_ip_timeout = 3
  wait_for_guest_net_timeout = 0

  network_interface {
    network_id = data.vsphere_virtual_machine.win2012-template.network_interfaces[0].network_id
  }

  disk {
    label = "disk0"
    size  = data.vsphere_virtual_machine.win2012-template.disks.0.size
    thin_provisioned = data.vsphere_virtual_machine.win2012-template.disks.0.thin_provisioned   
  }

  clone {
      template_uuid = data.vsphere_virtual_machine.win2012-template.id
      linked_clone = true
      customize {
        network_interface {
          ipv4_address = var.requested_win2012_ip_address
          ipv4_netmask = 24
          dns_server_list = ["8.8.8.8"]

        }
        windows_options {
          computer_name = "win2012-${local.env_id}"
          admin_password = "Password1"
        }
        ipv4_gateway = "192.168.51.1"       
      }
  } 
}

module "windows_rdp_link" {
    source = "./qualix_link_maker"
    qualix_ip = var.qualix_ip
    protocol = "rdp"
    connection_port = 3389
    target_ip_address = var.requested_win2012_ip_address
    target_username = "Administrator"
    target_password = "Password1"
}