output "wordpress-ip" {
  value = aws_instance.sandbox_wordpress_instance.public_ip
}

output "wordpress-address" {
  value = aws_lb.Wordpress_alb.dns_name
}

output "wordpress-ssh-link" {
  value = module.qualix_wordpress_link.http_link
}

