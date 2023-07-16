variable "tenant_id" {
  type = string
  description = "Tenant id"
}

variable "subscription_id" {
  type = string
  description = "Subscription id"
}

variable "client_id" {
  type = string
  description = "Client id"
}

variable "client_secret" {
  type = string
  description = "Client Secret"
}

variable "resource_group_location" {
default     = "West Europe"
description = "Location of the resource group."
}

variable "rg_name" {
type        = string
default     = "rg-avd-resources-1"
description = "Name of the Resource group in which to deploy service objects"
}

variable "workspace" {
type        = string
description = "Name of the Azure Virtual Desktop workspace"
default     = "AVD TF Workspace"
}

variable "hostpool" {
type        = string
description = "Name of the Azure Virtual Desktop host pool"
default     = "AVD-TF-HP-1"
}

variable "rfc3339" {
type        = string
default     = "2022-07-20T12:43:13Z"
description = "Registration token expiration"
}

variable "prefix" {
type        = string
default     = "avdtf-1"
description = "Prefix of the name of the AVD machine(s)"
}
