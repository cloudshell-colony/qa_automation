provider "aws" {
  region = "eu-west-1"
}

locals {
  common_tags = {
    creator        = "terraform"
  }
  
  initiator = "probably torque"
}

resource "aws_s3_bucket_object" "object" {
  bucket  = "${var.bucket_name}"
  key     = "${var.object_key}.json"
  #content = "{ \"Content\": \"${var.content}\"}"
  content = <<EOF
Content: ${var.content}
EOF
  
  tags = merge(
    local.common_tags,
    {
      "custom-tag-2" = local.initiator
    }
  )
}
