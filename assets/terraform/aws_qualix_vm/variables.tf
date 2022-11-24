variable aws_region {
    description = "AWS Region in which to deploy" 
    type = string
    default = "us-east-1"    
}

variable keypair_name {
    description = "Existing AWS Keypair to connect to VMs type for each instance" 
    type = string
    default = "TorqueSandbox"
}

variable "app_subnet_id" {
  description = "The application subnet ID to deploy QualiX in"
  type = string
}