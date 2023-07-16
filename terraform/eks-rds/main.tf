resource "aws_db_instance" "default" {
  # Allocating the storage for database instance.
  allocated_storage = 10
  # Declaring the database engine and engine_version
  engine         = var.engine
  engine_version = var.engine_version
  # Declaring the instance class
  instance_class = var.instance_class
  db_name        = var.name
  # User to connect the database instance 
  username = var.username
  # Password to connect the database instance 
  password             = var.password
  parameter_group_name = var.parameter_group_name

  skip_final_snapshot = true
}
