output "vm_id" {
  value = azurerm_windows_virtual_machine.my-win2016-vm.id
}
output "public_ip" {
  value = azurerm_windows_virtual_machine.my-win2016-vm.public_ip_address
}
output "admin_username" {
  value = azurerm_windows_virtual_machine.my-win2016-vm.admin_username
}
output "admin_initial_password" {
  value = azurerm_windows_virtual_machine.my-win2016-vm.admin_password
  sensitive = true
}
