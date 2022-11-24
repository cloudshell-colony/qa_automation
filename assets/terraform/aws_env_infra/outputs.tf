output "app_subnet_a_id" {
  value = aws_subnet.sandbox_app_subnet_a.id
}

output "app_subnet_b_id" {
  value = aws_subnet.sandbox_app_subnet_b.id
}

output "default_security_group_id" {
  value = aws_security_group.Default_Security_Group.id
}