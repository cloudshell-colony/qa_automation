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

# MySQL Section
locals {
  set_params = "export DB_PASS=${var.DB_PASS}\nexport DB_USER=${var.DB_USER}\nexport DB_NAME=${var.DB_NAME}\n"
  ubuntu_clean_ami_id = "ami-016587dea5af03adb"
}

data "aws_subnet" "app_subnet" {
  id = var.app_subnet_id
}

# MySQL App
resource "aws_instance" "sandbox_mysql_instance" {
  ami = local.ubuntu_clean_ami_id
  instance_type = var.instance_type
  key_name = var.keypair_name
  subnet_id = var.app_subnet_id
  security_groups = [ aws_security_group.MySQL_Security_Group.id, var.default_security_group_id ]
  user_data = "${replace(file("mysql.sh"), "#SET_ENVIRONMENT_VARIABLES", local.set_params)}"
  tags = {Name = "MySQL"}
}

# MySQL SG
resource "aws_security_group" "MySQL_Security_Group" {
  name = "MySQL Security Group"
  description = "mysql Security Group"
  vpc_id = data.aws_subnet.app_subnet.vpc_id
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["${var.qualix_private_ip}/32"]
  }

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    security_groups = [var.default_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

module "qualix_mysql_link" {
    source = "./qualix_link_maker"
    qualix_ip = var.qualix_public_ip
    protocol = "ssh"
    connection_port = 22
    target_ip_address = aws_instance.sandbox_mysql_instance.public_ip
    target_username = "ubuntu"
    target_password = "Quali@AWS"
}


