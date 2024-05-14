locals {
  workstation_users = [for email in var.project_principals : "user:${email}"]
  region = "northamerica-northeast1"
}

resource "google_workstations_workstation_cluster" "workstation_clusters" {
  for_each               = var.google_cloud_workstation_clusters
  provider               = google-beta
  workstation_cluster_id = each.key
  display_name           = each.value.display_name != null ? each.value.display_name : each.key
  network                = google_compute_network.vpc_network.id
  subnetwork             = google_compute_subnetwork.workstation-subnetwork.id
  location               = local.region
  labels                 = each.value.labels
  annotations            = each.value.annotations
}

resource "google_workstations_workstation_config" "workstation_configs" {
  for_each               = var.google_cloud_workstation_configurations
  provider               = google-beta
  display_name           = each.value.display_name != null ? each.value.display_name : each.key
  workstation_config_id  = each.key
  workstation_cluster_id = each.value.workstation_cluster_id
  location               = local.region
  idle_timeout           = each.value.idle_timeout
  running_timeout        = each.value.running_timeout
  replica_zones          = each.value.replica_zones
  labels                 = each.value.labels
  annotations            = each.value.annotations

  host {
    gce_instance {
      machine_type                 = each.value.host.gce_instance.machine_type
      boot_disk_size_gb            = each.value.host.gce_instance.boot_disk_size_gb
      disable_public_ip_addresses  = true
      enable_nested_virtualization = false
      service_account              = each.value.host.gce_instance.service_account
      pool_size                    = each.value.host.gce_instance.pool_size
    }
  }

  container {
    image       = each.value.container.image
    command     = each.value.container.command
    args        = each.value.container.args
    working_dir = each.value.container.working_dir
    env         = each.value.container.env
    run_as_user = each.value.container.run_as_user
  }

  depends_on = [google_workstations_workstation_cluster.workstation_clusters]
}

resource "google_workstations_workstation" "workstations" {
  for_each               = var.google_cloud_workstations
  provider               = google-beta
  display_name           = each.value.display_name != null ? each.value.display_name : each.key
  workstation_id         = each.key
  workstation_cluster_id = each.value.workstation_cluster_id
  workstation_config_id  = each.value.workstation_config_id
  location               = local.region
  labels                 = each.value.labels
  env                    = each.value.env
  annotations            = each.value.annotations

  depends_on = [google_workstations_workstation_config.workstation_configs]
}

resource "google_workstations_workstation_iam_binding" "workstation_user_binding" {
  for_each               = var.google_cloud_workstations
  provider               = google-beta
  project                = var.project
  location               = local.region
  workstation_cluster_id = each.value.workstation_cluster_id
  workstation_config_id  = each.value.workstation_config_id
  workstation_id         = each.key
  role                   = "roles/workstations.user"
  members                = local.workstation_users
  depends_on             = [google_workstations_workstation.workstations]
}
