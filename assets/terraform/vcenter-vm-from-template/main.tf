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

data "vsphere_compute_cluster" "cluster" {
  name          = "Sales Cluster"
  datacenter_id = data.vsphere_datacenter.dc.id  
}

data "vsphere_virtual_machine" "photon-template" {
  name          = "Photon-4.0-Template"
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_virtual_machine" "win2012-template" {
  name          = "Win-2012R2-Template"
  datacenter_id = data.vsphere_datacenter.dc.id
}

# resources
resource "vsphere_folder" "folder" {
  path          = "Leeor.v/Deployed Environments/${var.env_id}"
  type          = "vm"
  datacenter_id = "${data.vsphere_datacenter.dc.id}"
}

resource "vsphere_resource_pool" "environment-resource-pool" {
  name = "Env-${var.env_id}-pool"
  parent_resource_pool_id = data.vsphere_compute_cluster.cluster.resource_pool_id
  cpu_share_level = "high"
  memory_share_level = "high"
}

resource "vsphere_virtual_machine" "photon-vm" {
  name              = "My Photon - ${var.env_id}"
  folder            = vsphere_folder.folder.path
  datastore_id      = data.vsphere_datastore.ds.id
  resource_pool_id  = vsphere_resource_pool.environment-resource-pool.id
  num_cpus          = data.vsphere_virtual_machine.photon-template.num_cpus
  memory            = data.vsphere_virtual_machine.photon-template.memory
  guest_id          = data.vsphere_virtual_machine.photon-template.guest_id
  scsi_type         = data.vsphere_virtual_machine.photon-template.scsi_type
  efi_secure_boot_enabled = data.vsphere_virtual_machine.photon-template.efi_secure_boot_enabled
  firmware = data.vsphere_virtual_machine.photon-template.firmware
  wait_for_guest_ip_timeout = 2
  wait_for_guest_net_timeout = 0

  network_interface {
    network_id = data.vsphere_virtual_machine.photon-template.network_interfaces[0].network_id
  }
  
  disk {
    label = "disk0"
    size  = data.vsphere_virtual_machine.photon-template.disks.0.size
    thin_provisioned = data.vsphere_virtual_machine.photon-template.disks.0.thin_provisioned   
  }
  clone {
      template_uuid = data.vsphere_virtual_machine.photon-template.id
      linked_clone = true
      customize {
        network_interface {
          ipv4_address = var.requested_photon_ip_address
          ipv4_netmask = 24
          dns_server_list = ["8.8.8.8"]
        }
        linux_options {
          host_name = "photon-${var.env_id}"
          domain = "local"
        }
        ipv4_gateway = "192.168.51.1"       
      }
  } 
}

resource "vsphere_virtual_machine" "win-vm" {
  name              = "Win2012R2 - ${var.env_id}"
  folder            = vsphere_folder.folder.path
  datastore_id      = data.vsphere_datastore.ds.id
  resource_pool_id  = vsphere_resource_pool.environment-resource-pool.id
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
          computer_name = "win2012-${var.env_id}"
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

module "photon_ssh_link" {
    source = "./qualix_link_maker"
    qualix_ip = var.qualix_ip
    protocol = "ssh"
    connection_port = 22
    target_ip_address = vsphere_virtual_machine.photon-vm.guest_ip_addresses[0]
    target_username = "root"
    target_password = "Photon@Quali123"
}