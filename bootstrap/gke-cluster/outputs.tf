output "config-sync-creds" {
  value       = module.config_sync.git_creds_public
  description = "Public key for Config Sync"
}

output "backstage-sa" {
  value       = google_service_account.phac-backstage-sa.email
  description = "The email of the created Service Account for Backstage"
}

output "kcc-sa" {
  value       = google_service_account.phac-backstage-kcc-sa.name
  description = "The name of the KCC Service Account"
}

output "kcc-sa-email" {
  value       = google_service_account.phac-backstage-kcc-sa.email
  description = "The email address of the KCC Service Account"
}

output "postges-instance-name" {
  value       = google_sql_database_instance.instance.name
  description = "The name of the Postgres instances"
}

output "state-bucket-backend" {
  value       = google_storage_bucket.state.name
  description = "The name of the state file storage bucket"
}

