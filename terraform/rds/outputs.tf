output "hostname" {
  value = "${aws_db_instance.default.endpoint}"
}
output "connection_string" {
  sensitive = true
  value = "Server=${aws_db_instance.default.address};Port=${aws_db_instance.default.port};Database=${var.db_name};Uid=${var.username};Pwd=${random_password.password.result};"
}