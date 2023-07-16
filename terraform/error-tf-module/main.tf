terraform {
  required_version = ">= 0.13"
}

resource "null_resource" "task_log" {
  provisioner "local-exec" {
    command = "echo task_log. variables: rabbit_endpoint=bla."
  }
}

resource "null_resource" "task_long" {
  provisioner "local-exec" {
    command = "noSuchCOmmand"
  }
}

locals {
  key1 = "somekey"
}
