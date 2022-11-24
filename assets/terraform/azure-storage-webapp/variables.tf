# variable "tenant_id" {
#   type = string
#   description = "Tenant id"
# }

# variable "subscription_id" {
#   type = string
#   description = "Subscription id"
# }

# variable "client_id" {
#   type = string
#   description = "Client id"
# }

# variable "client_secret" {
#   type = string
#   description = "Client Secret"
# }

variable "sandbox_id" {
  type = string
  default = ""
}

variable "storage_account_name" {
  type = string
  default = "my-storage-account"
}
