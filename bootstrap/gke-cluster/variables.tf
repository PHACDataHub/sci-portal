variable "organization_id" {
  description = "Unique identifier for your Google Cloud organization."
  type        = string
}

variable "project_id" {
  description = "Unique identifier for your Google Cloud project."
}

variable "root_folder_id" {
  description = "Unique identifier for the root folder that templates will be provisioned under."
  type        = string
}

variable "config_sync_repo" {
  description = "The Git repository to connect Config Sync to. It should be an SSH URL like git@github.com:PHACDataHub/sci-portal.git"
}

variable "config_sync_branch" {
  description = "Specific branch in the Git repository that Config Sync monitors for changes."
}

variable "config_sync_kustomize_overlay" {
  description = "Specifies the environment for the Config Sync instance overlay. The current environment is `test`. This can be extended to support additional environments."
}

variable "cloudbuild_host_connection_name" {
  description = "The Cloud Build Host Connection name. For example, PHACDataHub."
}

variable "cloudbuild_host_connection_region" {
  description = "Region where the Cloud Build connection will be located. Consider the Git repository location for optimal performance."
}

variable "cloudbuild_repository_owner" {
  description = "The GitHub repository owner that will be watched for changes."
}

variable "cloudbuild_repository_name" {
  description = "The GitHub repository owner that will be watched for changes."
}

variable "cloudbuild_repository_branch" {
  description = "Specific branch in the Git repository to be monitored by Cloud Build for changes (triggers build pipeline on commit)."
}

variable "gc_notify_api_key" {
  description = "API key for GC Notify service."
}

variable "gc_notify_alert_template_id" {
  description = "ID of the alert template for GC Notify."
}

variable "gc_notify_over_budget_template_id" {
  description = "ID of the over budget template for GC Notify."
}

variable "backstage_budget_alert_events_token" {
  description = "Token for backstage budget alert events."
}

variable "gc_notify_uri" {
  description = "URI for GC Notify service."
}

variable "backstage_uri" {
  description = "URI for backstage service."
}