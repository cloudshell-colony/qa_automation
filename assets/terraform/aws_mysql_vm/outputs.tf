output "mysql-ip" {
  value = aws_instance.sandbox_mysql_instance.public_ip
}

output "mysql-ssh-link" {
  value = module.qualix_mysql_link.http_link
}

output "mysql-private-dns" {
  value = aws_instance.sandbox_mysql_instance.private_dns
}