variable "username" {
  type = string
  sensitive = true
}

variable "password" {
  type = string
  sensitive = true
}

variable "hostname" {
  type = string
  sensitive = true
}

variable "datacenter_name" {
  type = string
  default = "Sandbox"
}

variable "datastore_name" {
  type = string
  default = "SB-DS2"
}

variable "compute_cluster_name" {
  type = string
  default = "Sandbox Cluster"
}

variable "network_name" {
  type = string
  default = "VLan65-1"
}

variable "virtual_machine_template_name" {
  type = string
}

variable "virtual_machine_name" {
  type = string
  default = "vm started by a script"
}

variable "virtual_machine_folder" {
  type = string
  default = "alexander.g"
}

