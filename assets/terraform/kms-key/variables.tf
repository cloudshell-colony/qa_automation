variable "region" {}

variable "description" {
    type = string
    default = "KMS Key from TF"
}

variable "deletion_window_in_days" {
    type = number
    default = "10"
}

variable "enable_key_rotation" {
    type = bool
    default = true
}

