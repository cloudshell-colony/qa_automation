output "vm_id" {
  value = azurerm_windows_virtual_machine.my-win2016-vm.id
}

output "public_ip" {
  value = azurerm_windows_virtual_machine.my-win2016-vm.public_ip_address
}

output "vm_rdp_link" {
  value = length(module.qualix_windows_vm_link) == 1 ? module.qualix_windows_vm_link[0].http_link : ""
  # sensitive = true
}

output "qualix_ip" {
  value = var.qualix_ip
}