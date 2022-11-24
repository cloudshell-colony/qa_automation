terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0.0"
    }
  }
}

provider "aws" {
  region = var.region
}

resource "aws_kms_key" "kms_key" {
  description             = var.description
  enable_key_rotation = var.enable_key_rotation
  deletion_window_in_days = var.deletion_window_in_days
}