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

# Infrasturcture Section
data "aws_availability_zones" "available" {
  state = "available" 
}

# VPC
resource "aws_vpc" "sandbox_vpc" {
    cidr_block = "10.1.0.0/16"
    enable_dns_hostnames = true
    tags = {Name = "sandbox_vpc"}
}
# end VPC

# Application Subnet - AZ A and AZ B
resource "aws_subnet" "sandbox_app_subnet_a" {
    vpc_id = aws_vpc.sandbox_vpc.id
    cidr_block = "10.1.1.0/24"
    availability_zone = data.aws_availability_zones.available.names[0]
    map_public_ip_on_launch = true
    tags = {Name = "app-subnet-0"}
}

resource "aws_subnet" "sandbox_app_subnet_b" {
    vpc_id = aws_vpc.sandbox_vpc.id
    cidr_block = "10.1.2.0/24"
    availability_zone = data.aws_availability_zones.available.names[1]
    map_public_ip_on_launch = true
    tags = {Name = "app-subnet-1"}
}

# Management Subnet
resource "aws_subnet" "sandbox_mgmt_subnet" {
    vpc_id = aws_vpc.sandbox_vpc.id
    cidr_block = "10.1.0.0/24"
    availability_zone = data.aws_availability_zones.available.names[0]
    map_public_ip_on_launch = true
    tags = {Name = "mng-subnet"}
}

# Internet Gateway
resource "aws_internet_gateway" "sandbox_igw" {
    vpc_id = aws_vpc.sandbox_vpc.id
}


# Route Table
resource "aws_route_table" "sandbox_rt" {
  vpc_id = aws_vpc.sandbox_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.sandbox_igw.id
  }

  tags = {Name = "public-route-table"}
}

resource "aws_route_table_association" "sandbox_app_subnet_a_assoc" {
    subnet_id = aws_subnet.sandbox_app_subnet_a.id
    route_table_id = aws_route_table.sandbox_rt.id
}

resource "aws_route_table_association" "sandbox_app_subnet_b_assoc" {
    subnet_id = aws_subnet.sandbox_app_subnet_b.id
    route_table_id = aws_route_table.sandbox_rt.id
}

resource "aws_route_table_association" "sandbox_mgmt_subnet_assoc" {
    subnet_id = aws_subnet.sandbox_mgmt_subnet.id
    route_table_id = aws_route_table.sandbox_rt.id
}

# Default SG
resource "aws_security_group" "Default_Security_Group" {
  name = "defaultSG"
  description = "Default Security Group"
  vpc_id = aws_vpc.sandbox_vpc.id  
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self = true
  }
  ingress {
    from_port   = 22
    to_port     = 22
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
