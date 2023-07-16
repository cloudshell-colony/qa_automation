
    variable "compartment_ocid" {}
    variable "tenancy_ocid" {}
    variable "region" {}

#VCN INFO    
    variable "vcn_display_name" {
      default = "Terravcn"
    }
    
    variable "vcn_cidr" {
      default = "192.168.64.0/20"
    }

    variable "vcn_dns_label" {
      default     = "Terra"
    }
# SUBNET INFO
    variable "subnet_dns_label" {
      default = "terra"
    }
    variable "subnet_display_name"{
      default = "terrasub" 
      }

    variable "subnet_cidr"{
      default = "192.168.78.0/24"
      }  
# COMPUTE INSTANCE INFO

      variable "instance_display_name" {
        default = "YakirDemo"
      }
      variable "extended_metadata" {
        default     = {}
      }
     # variable "ipxe_script" {}
      variable "preserve_boot_volume" {
        default = false
      }
      variable "boot_volume_size_in_gbs" {
        default = "50"
      }
      variable "shape" {
        default = "VM.Standard.E3.Flex"
      }
      variable "instance_image_ocid" {
        type = map

        default = {
        # See https://docs.us-phoenix-1.oraclecloud.com/images/
        # Oracle-provided image "Oracle-Linux-7.8-2020.04.17-0"
        us-phoenix-1 = "ocid1.image.oc1.phx.aaaaaaaav3isrmykdh6r3dwicrdgpmfdv3fb3jydgh4zqpgm6yr5x3somuza"
        us-ashburn-1   = "ocid1.image.oc1.iad.aaaaaaaahjkmmew2pjrcpylaf6zdddtom6xjnazwptervti35keqd4fdylca"
       ca-montreal-1  = "ocid1.image.oc1.ca-montreal-1.aaaaaaaamcmyjjewzrw7qz66lnsl4hf7mkaznw6iyrrdwc22z56vltj36mka"
       ca-toronto-1   = "ocid1.image.oc1.ca-toronto-1.aaaaaaaaw6w5y4vbjdg6gqptyagaq2o7kdj6mupblphd73qvfszufbvv2rfa"  # Centos 7
       }
     }     
# VNIC INFO
      variable "hostname_label" {
        default = "terrahost" 
      }
       variable "assign_public_ip" {
        default = true
      }
      variable "vnic_name" {
        default = "eth01"
      }
      variable "private_ip" {
        default = "10.0.0.205"
      }
      variable "skip_source_dest_check" {
        default = false
      }
     # variable "subnet_ocid" {}
   #   variable "user_data" {}
      variable "instance_timeout" {
        default = "25m"
      }
      variable "block_storage_size_in_gbs" {
        default = "50"
      }
      variable "attachment_type" {
        default = "iscsi"
      }
      variable "use_chap" {
        description = "Whether to use CHAP authentication for the volume attachment. "
        default     = true
      }
      variable "resource_platform" { 
        description = "Platform to create resources in. "
        default     = "linux"
      }
      variable "instance_ocpus" {
      default = 1
      }        
  
