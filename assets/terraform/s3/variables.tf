variable "name" {
    description = "Name of S3 bucket"
    type = string
}

variable "region" {
    description = "Region where to create resources" 
    type = string
    default = "eu-west-1"
}

variable "acl" {
    description = "Canned ACL to apply to the bucket. Default is private."
    type = string
    default = "private"

    validation {
        condition = contains(["private", "public-read", "public-read-write", "aws-exec-read", "authenticated-read", "log-delivery-write"], var.acl)
        error_message = "Provided ACL is not a recognized canned type. The page https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html#canned-acl has available options."
    }
}

variable "user" {
    description = "Username to assign permissions for S3 bucket to. If left blank, will not create permissions."
    default = "none"
}
