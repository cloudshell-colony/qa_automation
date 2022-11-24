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

# QualiX Section
# Guacamole App
resource "aws_instance" "sandbox_QualiX_instance" {
  ami = "ami-04f5641b0d178a27a"
  instance_type = "t3a.small"
  key_name = var.keypair_name
  subnet_id = aws_subnet.sandbox_mgmt_subnet.id
  security_groups = [ aws_security_group.Guac_Security_Group.id ]
  user_data = file("install_qualix.sh")
  tags = {Name = "QualiX"}
}

resource "aws_security_group" "Guac_Security_Group" {
  name = "Guacamole Security Group"
  description = "Guacamole Security Group"
  vpc_id = aws_vpc.sandbox_vpc.id  
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



# MySQL Section
locals {
  set_params = "export DB_PASS=${var.DB_PASS}\nexport DB_USER=${var.DB_USER}\nexport DB_NAME=${var.DB_NAME}\n"
}

# MySQL App
resource "aws_instance" "sandbox_mysql_instance" {
  ami = "ami-016587dea5af03adb"
  # instance_type = var.instance_type
  instance_type = "t3a.large"
  key_name = var.keypair_name
  subnet_id = aws_subnet.sandbox_app_subnet_a.id
  security_groups = [ aws_security_group.MySQL_Security_Group.id, aws_security_group.Default_Security_Group.id ]
  user_data = "${replace(file("mysql.sh"), "#SET_ENVIRONMENT_VARIABLES", local.set_params)}"
  tags = {Name = "MySQL"}

    # Add Provisioner for install
}

# MySQL SG
resource "aws_security_group" "MySQL_Security_Group" {
  name = "MySQL Security Group"
  description = "mysql Security Group"
  vpc_id = aws_vpc.sandbox_vpc.id  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    security_groups = [aws_security_group.Guac_Security_Group.id]
    # cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    security_groups = [aws_security_group.Default_Security_Group.id]
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
    qualix_ip = aws_instance.sandbox_QualiX_instance.public_ip
    protocol = "ssh"
    connection_port = 22
    target_ip_address = aws_instance.sandbox_mysql_instance.public_ip
    target_username = "ubuntu"
    target_password = "Quali@AWS"
}


# Wordpress Section
resource "random_pet" "wordpress_pet_name" {
  keepers = {
    # Generate a new pet name each time we switch to a id
    instance_id = aws_instance.sandbox_wordpress_instance.id
  }
}

# Wordpress App
resource "aws_instance" "sandbox_wordpress_instance" {
  ami = "ami-016587dea5af03adb"
  instance_type = var.instance_type
  key_name = var.keypair_name
  subnet_id = aws_subnet.sandbox_app_subnet_a.id
  security_groups = [ aws_security_group.Wordpress_Security_Group.id, aws_security_group.Default_Security_Group.id ]
  user_data = "${replace(file("wordpress.sh"), "#SET_ENVIRONMENT_VARIABLES", "${local.set_params}export DB_HOSTNAME=${aws_instance.sandbox_mysql_instance.private_dns}")}"
  tags = {Name = "Wordpress"}

    # Add Provisioner for install
}

# Wordpress SG
resource "aws_security_group" "Wordpress_Security_Group" {
  name = "Wordpress Security Group"
  description = "wordpress Security Group"
  vpc_id = aws_vpc.sandbox_vpc.id  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    security_groups = [aws_security_group.Guac_Security_Group.id]
    # cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    security_groups = [aws_security_group.ALB_Security_Group.id, aws_security_group.Default_Security_Group.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ALB SG
resource "aws_security_group" "ALB_Security_Group" {
  name = "MainALBSG"
  description = "ALB security Group for access to instances"
  vpc_id = aws_vpc.sandbox_vpc.id  
  ingress {
    description = "public port access"
    from_port   = 80
    to_port     = 80
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

# Target Group - wordpress - TODO
resource "aws_lb_target_group" "Wordpress_tg" {
  name     = substr("Wordpress-LB-TG-${random_pet.wordpress_pet_name.id}", 0, 32)
  port     = 80
  protocol = "HTTP"
  vpc_id = aws_vpc.sandbox_vpc.id
  health_check {
    path = "/wp-includes/images/blank.gif"
    matcher = "200-299"
    healthy_threshold = 5
    unhealthy_threshold = 2
  }
}

resource "aws_lb_target_group_attachment" "wordpress_tg_attachment" {
  target_group_arn = aws_lb_target_group.Wordpress_tg.arn
  target_id        = aws_instance.sandbox_wordpress_instance.id
  port             = 80
}

# Target Group - Empty - TODO
resource "aws_lb_target_group" "Empty_tg" {
  name     = "Empty-LB-TG-${random_pet.wordpress_pet_name.id}"
  port     = 80
  protocol = "HTTP"
  vpc_id = aws_vpc.sandbox_vpc.id
}

# ALB - Wordpress
resource "aws_lb" "Wordpress_alb" {
  name               = "wordpressALB-${random_pet.wordpress_pet_name.id}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ALB_Security_Group.id]
  subnets            = [aws_subnet.sandbox_app_subnet_a.id, aws_subnet.sandbox_app_subnet_b.id]

  tags = {Name = "public-route-table"}
}

resource "aws_lb_listener" "worpdress_listener" {
  load_balancer_arn = aws_lb.Wordpress_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.Wordpress_tg.arn
  }
}

module "qualix_wordpress_link" {
    source = "./qualix_link_maker"
    qualix_ip = aws_instance.sandbox_QualiX_instance.public_ip
    protocol = "ssh"
    connection_port = 22
    target_ip_address = aws_instance.sandbox_wordpress_instance.public_ip
    target_username = "ubuntu"
    target_password = "Quali@AWS"
}

