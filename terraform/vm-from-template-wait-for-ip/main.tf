provider "vsphere" {
  user           = var.username
  password       = var.password
  vsphere_server = var.hostname
  allow_unverified_ssl = true
}

data "vsphere_datacenter" "dc" {
  name = var.datacenter_name
}

data "vsphere_datastore" "ds" {
  name          = var.datastore_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_compute_cluster" "cluster" {
  name          = var.compute_cluster_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_network" "network" {
  name          = var.network_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

data "vsphere_virtual_machine" "template" {
  name = var.virtual_machine_template_name
  datacenter_id = data.vsphere_datacenter.dc.id
}

resource "vsphere_virtual_machine" "vm" {
  name             = var.virtual_machine_name
  datastore_id     = data.vsphere_datastore.ds.id
  resource_pool_id = data.vsphere_compute_cluster.cluster.resource_pool_id
  scsi_type        = data.vsphere_virtual_machine.template.scsi_type
  guest_id = data.vsphere_virtual_machine.template.guest_id
  folder = var.virtual_machine_folder

  network_interface {
    network_id   = data.vsphere_network.network.id
    adapter_type = data.vsphere_virtual_machine.template.network_interface_types[0]
  }

  disk {
    label            = "disk0"
    size             = data.vsphere_virtual_machine.template.disks.0.size
    thin_provisioned = data.vsphere_virtual_machine.template.disks.0.thin_provisioned
  }

 clone {
   template_uuid = data.vsphere_virtual_machine.template.id
  }
}

