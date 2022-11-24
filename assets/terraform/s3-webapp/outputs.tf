output "endpoint" {
  value = local.should_use_encryption ? "https://${aws_s3_bucket.bucket.bucket_regional_domain_name}/index.html" : "http://${aws_s3_bucket_website_configuration.bucket_conf.website_endpoint}/index.html"
}
