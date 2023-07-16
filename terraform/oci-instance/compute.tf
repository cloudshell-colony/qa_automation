
terraform {
  required_version = ">= 0.12.0"
}

provider "oci" {
   auth = "InstancePrincipal"
   region = var.region
}

resource "oci_core_instance" "terra_inst" {
  availability_domain  = "GKbV:UK-LONDON-1-AD-1"
  compartment_id       = var.compartment_ocid
  display_name         = var.instance_display_name
  preserve_boot_volume = var.preserve_boot_volume   # false
  shape                = var.shape
  shape_config {
    memory_in_gbs = 6
    ocpus = 1
  }
  create_vnic_details {
    assign_public_ip       = var.assign_public_ip       # true
    display_name           = var.vnic_name              # eth01
    hostname_label         = var.hostname_label         # terrahost
    private_ip             = var.private_ip             # true
    skip_source_dest_check = var.skip_source_dest_check # false
    subnet_id              = "ocid1.subnet.oc1.uk-london-1.aaaaaaaar6z4dfneujw32q3drgleiy3bvzvqxxr2utasjqpggzeibdu6qlvq"
  }

  metadata = {
    # ssh_authorized_keys = file("../../.ssh/id_rsa.pub")
    user_data = base64encode(file("./cloud-init/vm.cloud-config"))
  }

  source_details {
    boot_volume_size_in_gbs = var.boot_volume_size_in_gbs # 20G
    source_type = "image"
    source_id   = "ocid1.image.oc1.uk-london-1.aaaaaaaa2bmwrd7wucqawzbwcfpcuo5jjefa4sex37fbfaxvn2x2ce3j6rra"
  }

  timeouts {
    create = var.instance_timeout # 25m
  }
}

resource "oci_core_volume" "terra_vol" {
  availability_domain = oci_core_instance.terra_inst.availability_domain
  compartment_id      = var.compartment_ocid
  display_name        = "${oci_core_instance.terra_inst.display_name}_volume_0"
  size_in_gbs         = var.block_storage_size_in_gbs # 20G
}

resource "oci_core_volume_attachment" "terra_attach" {
  attachment_type = var.attachment_type
  # compartment_id  = var.compartment_ocid
  instance_id     = oci_core_instance.terra_inst.id
  volume_id       = oci_core_volume.terra_vol.id
  use_chap        = var.use_chap  # true
}

