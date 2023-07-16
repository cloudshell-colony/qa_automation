variable "hostname" {
  type = string
  sensitive = true
}

variable "username" {
  type = string
  sensitive = true
}

variable "password" {
  type = string
  sensitive = true
}

variable "datacenter_name" {
  type = string
  default = "Sandbox"
}
