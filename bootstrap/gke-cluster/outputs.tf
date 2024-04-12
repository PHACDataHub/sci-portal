output "config-sync-creds" {
  value       = module.config_sync.git_creds_public
  description = "public key for config sync"
}