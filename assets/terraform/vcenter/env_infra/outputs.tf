output "env_resource_pool_id" {
    value = vsphere_resource_pool.environment-resource-pool.id  
}

output "env_vm_folder_path" {
    value = vsphere_folder.folder.path
}