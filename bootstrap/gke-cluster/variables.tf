variable "project_id" {
  description = "Unique identifier for your Google Cloud project (find it in the Google Cloud Console)."
}

variable "config_sync_repo" {
  description = "The Git repository to connect Config Sync to. It should be an SSH URL like git@github.com:PHACDataHub/sci-portal.git"
}

variable "config_sync_target_environment" {
  description = "Specifies the environment for the Config Sync instance overlay. The current environment is `test`. This can be extended to support additional environments."
}

variable "cloudbuildv2_connection" {
  description = "Full name of the Cloud Build connection (format: projects/<project_id>/locations/<region>/connections/<connection_name>)."
}

variable "cloudbuildv2_connection_region" {
  description = "Region where the Cloud Build connection will be located (consider Git repository location for optimal performance)."
}

variable "cloudbuildv2_connection_remote_uri" {
  description = "Web address (URI) of the Git repository to connect to Cloud Build (source code or project files)."
}

variable "cloudbuildv2_connection_trigger_branch" {
  description = "Specific branch in the Git repository to be monitored by Cloud Build for changes (triggers build pipeline on commit)."
}
