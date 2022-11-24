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

data "vsphere_compute_cluster" "cluster" {
  name          = "Sales Cluster"
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

