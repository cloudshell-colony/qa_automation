variable "region" {}
variable "prefix" {}
variable "name" {}
variable "encryption_key_arn" {
  default = ""
  type = string
}