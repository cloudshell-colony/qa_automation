variable "private_cloud_login" {
  type = string
  sensitive = true
}

variable "private_cloud_password" {
  type = string
  sensitive = true
}

variable "private_cloud_host" {
  type = string
  sensitive = true
}

variable "datacenter_name" {
  type = string
  default = "Qualisystems"
}

variable "datastore_name" {
  type = string
  default = "DATASTORE HOST1"
}

variable "network_name" {
  type = string
  default = "VM Network"
}

variable "resource_pool_name" {
  type = string
  default = "DevOps"
}

variable "virtual_machine_template_name" {
  type = string
  default = "terraform_test"
}

variable "virtual_machine_name" {
  type = string
  default = "vm started by a script"
}

variable "virtual_machine_folder" {
  type = string
  default = "Tomer.C"
}

