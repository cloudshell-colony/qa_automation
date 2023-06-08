terraform {
  required_version = ">= 0.13"
//  backend "local" {
//    path    = "mybackend/terraform.tfstate"
//  }
}



// Torque can now update environments!!!

resource "time_static" "example" {}

resource "null_resource" "task_log" {
  provisioner "local-exec" {
    command = "echo task_log. variables: rabbit_endpoint=bla."
  }
}

# resource "null_resource" "task_long" {
#   provisioner "local-exec" {
#     command = "for i in {1..3}; do echo waiting; sleep 2; done"
#   }
# }

# resource "null_resource" "set_initial_state" {
#   provisioner "local-exec" {
#     interpreter = ["bash", "-c"]
#     command = "echo \"0\" > counter"
#   }
# }

# resource "null_resource" "wait" {
#   provisioner "local-exec" {
#     interpreter = ["bash", "-c"]
#     command = "while [[ $(cat counter) != \"10\" ]]; do sleep 5; done; sleep 3;"
#   }
# }

locals {
  key1 = "somekey"
}

#vido was here
