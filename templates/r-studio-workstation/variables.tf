variable "project" {
  description = "Your GCP Project ID"
  type        = string
}

variable "gcs_labels" {
  description = "Labels to attach to the GCS Bucket. Useful for labelling resources for billing purposes"
  type        = map(string)
  default     = null
}

variable "notification_channels_email" {
  description = "Email address to send notifications for Alert Policies"
  type        = string
}

variable "google_cloud_workstation_clusters" {
  description = "A map containing properties of Google Cloud Workstation clusters to create"
  type = map(object({
    display_name = optional(string)
    labels       = map(string)
    annotations  = map(string)
  }))
}

variable "google_cloud_workstation_configurations" {
  description = "A map containing configurations for all necessary Google Cloud Workstation instances"
  type = map(object({
    display_name           = optional(string)
    workstation_cluster_id = string
    idle_timeout           = string
    running_timeout        = string
    replica_zones          = optional(list(string), [])
    annotations            = optional(map(string), {})
    labels                 = optional(map(string), {})
    host = object({
      gce_instance = object({
        machine_type      = optional(string)
        boot_disk_size_gb = optional(number)
        service_account   = string
        pool_size         = optional(string, 0)
      })
    })
    container = object({
      image       = string
      command     = optional(list(string), [])
      args        = optional(list(string), [])
      working_dir = optional(string)
      env         = optional(map(string), {})
      run_as_user = optional(string)
    })
  }))
}

variable "google_cloud_workstations" {
  description = "A map containing properties for every instance of Google Cloud Workstation to create"
  type = map(object({
    display_name           = optional(string)
    workstation_cluster_id = string
    workstation_config_id  = string
    labels                 = map(string)
    env                    = map(string)
    annotations            = map(string)
  }))
}

variable "project_principals" {
  description = "List of workstation users"
  type        = list(string)
}

variable "cloudbuild_repo" {
  description = "GitHub repository where the RStudio image is specified"
  type        = string
}

variable "github_pat" {
  description = "GitHub Personal Access Token"
  type        = string
}

variable "github_cloudbuild_installation_id" {
  description = "Installation ID of Cloud Build GitHub application."
  type        = string
}
