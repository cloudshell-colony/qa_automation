variable "vm_name" {
  type = string
  default = "MyVM"
  description = "VM Name"
}

variable "source_cidr" {
  type = string
  default = "0.0.0.0/0"
  description = "IP Range that can access the deployed VMs"  
}

variable "env_id" {
  type = string
  description = "The Torque Env ID"
}