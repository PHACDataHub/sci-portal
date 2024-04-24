output "config-sync-creds" {
  value       = module.config_sync.git_creds_public
  description = "public key for config sync"
}

output "backstage-sa" {
  value       = google_service_account.phac-backstage-sa.email
  description = "The email of the created service account for backstage"
}

output "postges-instance-name" {
  value       = google_sql_database_instance.instance.name
  description = "The name of the postgrest instances"
}

output "state-bucket-backend" {
  value       = google_storage_bucket.state.name
  description = "The name of the state file storage bucket"
}

