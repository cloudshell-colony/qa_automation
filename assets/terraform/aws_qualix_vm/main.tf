# require provideres block
terraform {
    required_providers {
        aws = {
            source = "hashicorp/aws"
            version = "~>4.0.0"
        }
    }  
}

# Provider block
provider "aws" {
    region = var.aws_region
}

locals {
  centos_clean_ami_id = "ami-04f5641b0d178a27a"
  default_qualix_instance_type = "t3a.small"
}

data "aws_subnet" "app_subnet" {
  id = var.app_subnet_id
}

# QualiX Section
# Guacamole App
resource "aws_instance" "sandbox_QualiX_instance" {
  ami = local.centos_clean_ami_id
  instance_type = local.default_qualix_instance_type
  key_name = var.keypair_name
  subnet_id = data.aws_subnet.app_subnet.id
  security_groups = [ aws_security_group.Guac_Security_Group.id ]
  user_data = file("install_qualix.sh")
  tags = {Name = "QualiX"}
}

resource "aws_security_group" "Guac_Security_Group" {
  name = "Guacamole Security Group"
  description = "Guacamole Security Group"
  vpc_id = data.aws_subnet.app_subnet.vpc_id
  ingress {
    description = "public port access"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "public port access"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}



