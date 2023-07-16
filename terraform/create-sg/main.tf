provider "aws" {
  region = "eu-west-1"
}

locals {
  common_tags = {
    environment  = "tintin"
    name = "tomer"
  }
}

resource "aws_security_group" "my_sg" {
  name        = "${var.SG_NAME}"
  description = "SG created from tomer.v service"

  tags = {
    Name = "${var.SG_NAME}"
  }
}