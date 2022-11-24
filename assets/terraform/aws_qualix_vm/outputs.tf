output "qualix_private_ip" {
  value = aws_instance.sandbox_QualiX_instance.private_ip
}

output "qualix_public_ip" {
  value = aws_instance.sandbox_QualiX_instance.public_ip
}

