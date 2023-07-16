variable "bucket_name" {}
variable "object_key" {}
variable "content" {}

variable "region" {
    description = "Region where to create resources" 
    type = string
    default = "eu-west-1"
}
