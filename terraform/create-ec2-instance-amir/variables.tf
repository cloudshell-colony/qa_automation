variable "instance_type" {
  description = "(Optional) The instance type to use for the instance. defaults to t3.micro"
  type        = string
  default     = "t3.micro"
}

variable "ami" {
  description = "(Optional) AMI to use for the instance. Defaults to latest Ubuntu 18.04 LTS"
  type        = string
  default     = ""
}
