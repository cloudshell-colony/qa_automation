output "public_ip" {
  description = "The public IP address assigned to the instance."
  value       = aws_instance.this.public_ip
}

output "password" {
  description = "The password generated for the instance."
  value       = random_password.password[0].result
  sensitive = true
}