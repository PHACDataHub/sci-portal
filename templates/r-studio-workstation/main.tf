module "private_cloud_workstation_instances" {
  source                                  = "./module"
  project                                 = var.project
  vpc_sc_enabled                          = false
  gcs_labels                              = var.gcs_labels
  notification_channels_email             = var.notification_channels_email
  cloudbuild_repo                         = var.cloudbuild_repo
  github_pat                              = var.github_pat
  github_cloudbuild_installation_id       = var.github_cloudbuild_installation_id
  google_cloud_workstation_clusters       = var.google_cloud_workstation_clusters
  google_cloud_workstation_configurations = var.google_cloud_workstation_configurations
  google_cloud_workstations               = var.google_cloud_workstations
  project_principals                      = var.project_principals
}
