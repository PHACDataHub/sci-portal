locals {
  region = "northamerica-northeast1"

  gke_props = {
    name              = "phac-backstage"
    zones             = ["northamerica-northeast1-a", "northamerica-northeast1-b", "northamerica-northeast1-c"]
    ip_range_pods     = "gke-01-pods"
    ip_range_services = "gke-02-services"
  }
  kcc_props = {
    sa_account_id   = "phac-backstage-kcc-sa"
    sa_display_name = "phac-backstage-kcc-sa"
    folder_roles = [
      "roles/resourcemanager.projectCreator",
      "roles/resourcemanager.folderCreator"
    ]
    org_roles = [
      "roles/billing.user",
      "roles/billing.costsManager"
    ]
  }
  crossplane_props = {
    sa_account_id   = "crossplane-sa"
    sa_display_name = "crossplane-sa"
    project_roles = [
      "roles/storage.admin",
      "roles/bigquery.dataOwner",
      "roles/bigquery.jobUser"
    ]
    folder_roles = [
      "roles/resourcemanager.projectCreator",
      "roles/resourcemanager.folderCreator"
    ]
    org_roles = [
      "roles/billing.user",
      "roles/billing.costsManager"
    ]
  }
  backstage_props = {
    sa_account_id   = "phac-backstage-sa"
    sa_display_name = "phac-backstage-sa"
    gke_sa_name     = "backstage/backstage-sa"
  }
  cloudsql = {
    instance_name       = "backstage-instance"
    database_version    = "POSTGRES_14"
    database_tier       = "db-f1-micro"
    deletion_protection = false
  }
}
