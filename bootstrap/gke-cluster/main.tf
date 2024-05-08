data "google_client_config" "default" {}

data "google_project" "project" {
  project_id = var.project_id
}


resource "google_artifact_registry_repository" "ph_backstage_repo" {
  location      = local.region
  repository_id = "ph-backstage"
  description   = "Backstage docker repository"
  format        = "DOCKER"
}

resource "google_cloudbuildv2_repository" "data_science_portal" {
  name              = var.cloudbuild_repository_name
  parent_connection = "projects/${var.project_id}/locations/${var.cloudbuild_host_connection_region}/connections/${var.cloudbuild_host_connection_name}"
  remote_uri        = "https://github.com/${var.cloudbuild_repository_owner}/${var.cloudbuild_repository_name}.git"
}

resource "google_cloudbuild_trigger" "data_science_portal_trigger" {
  name     = "backstage-image-trigger"
  location = var.cloudbuild_host_connection_region
  repository_event_config {
    repository = google_cloudbuildv2_repository.data_science_portal.id
    push {
      branch = var.cloudbuild_repository_branch
    }
  }
  included_files = "backstage/**"
  filename       = "cloudbuild.yaml"
}

module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/beta-autopilot-public-cluster"
  version = "~> 30.0"

  project_id                 = var.project_id
  name                       = local.gke_props.name
  region                     = local.region
  zones                      = local.gke_props.zones
  network                    = google_compute_network.phac_network.name
  subnetwork                 = google_compute_subnetwork.phac_subnet.name
  ip_range_pods              = local.gke_props.ip_range_pods
  ip_range_services          = local.gke_props.ip_range_services
  horizontal_pod_autoscaling = true
  grant_registry_access      = true
  release_channel            = "REGULAR"
  deletion_protection        = false
  cluster_resource_labels    = { "mesh_id" : "proj-${data.google_project.project.number}" }
}

resource "google_service_account" "phac-backstage-kcc-sa" {
  account_id   = local.kcc_props.sa_account_id
  display_name = local.kcc_props.sa_display_name
  project      = var.project_id
  description  = "GCP SA bound to K8S SA ${var.project_id}[phac-backstage-kcc-sa]	"
}

# Allows the GKE Service Account to use the GCP Service Account via Workload Identity
resource "google_service_account_iam_member" "iam_workloadidentity_kcc" {
  service_account_id = google_service_account.phac-backstage-kcc-sa.name
  role               = "roles/iam.workloadIdentityUser"

  # Workload Identity is specified per-project and per-namespace
  member = "serviceAccount:${var.project_id}.svc.id.goog[cnrm-system/cnrm-controller-manager]"
}

resource "google_service_account_iam_member" "iam_workloadidentity_tf" {
  service_account_id = google_service_account.phac-backstage-kcc-sa.name
  role               = "roles/iam.workloadIdentityUser"

  # Workload Identity is specified per-project and per-namespace
  member = "serviceAccount:${var.project_id}.svc.id.goog[crossplane-system/phac-backstage-kcc-sa]"
}

resource "google_project_iam_member" "editor_role" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.phac-backstage-kcc-sa.email}"
}

# Grants the KCC the roles defined in locals to the primary portal folder
resource "google_folder_iam_member" "kcc_folder_role_bindings" {
  for_each = toset(local.kcc_props.folder_roles)

  folder = "folders/${var.root_folder_id}"
  role   = each.value
  member = "serviceAccount:${google_service_account.phac-backstage-kcc-sa.email}"
}

# Grants the KCC the roles defined in locals to the organizationr
resource "google_organization_iam_member" "kcc_org_role_bindings" {
  for_each = toset(local.kcc_props.org_roles)

  org_id = var.organization_id
  role   = each.value
  member = "serviceAccount:${google_service_account.phac-backstage-kcc-sa.email}"
}

resource "google_service_account" "crossplane-sa" {
  account_id   = local.crossplane_props.sa_account_id
  display_name = local.crossplane_props.sa_display_name
  project      = var.project_id
  description  = "GCP SA bound to Crossplane"
}

# Grants the Crossplane SA the roles defined in locals to the primary portal folder
resource "google_project_iam_member" "crossplane_folder_role_bindings" {
  for_each = toset(local.crossplane_props.project_roles)

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.crossplane-sa.email}"
}

# Grants the Crossplane SA the roles defined in locals to the primary portal folder
resource "google_folder_iam_member" "crossplane_folder_role_bindings" {
  for_each = toset(local.crossplane_props.folder_roles)

  folder = "folders/${var.root_folder_id}"
  role   = each.value
  member = "serviceAccount:${google_service_account.crossplane-sa.email}"
}

# Grants the Crossplane SA the roles defined in locals to the organizationr
resource "google_organization_iam_member" "crossplane_org_role_bindings" {
  for_each = toset(local.crossplane_props.org_roles)

  org_id = var.organization_id
  role   = each.value
  member = "serviceAccount:${google_service_account.crossplane-sa.email}"
}

module "config_sync" {
  source = "terraform-google-modules/kubernetes-engine/google//modules/acm"
  depends_on = [
    google_project_service.gke_hub_api,
    google_project_service.acm_api,
    google_project_service.anthos_api
  ]

  project_id   = var.project_id
  cluster_name = module.gke.name
  location     = module.gke.location

  source_format = "unstructured"
  sync_repo     = var.config_sync_repo
  sync_branch   = var.config_sync_branch
  policy_dir    = "root-sync/overlays/${var.config_sync_kustomize_overlay}"
}

module "asm" {
  source                    = "terraform-google-modules/kubernetes-engine/google//modules/asm"
  project_id                = var.project_id
  cluster_name              = module.gke.name
  cluster_location          = module.gke.location
  enable_cni                = true
  mesh_management           = "MANAGEMENT_AUTOMATIC"
  enable_fleet_registration = true
  enable_mesh_feature       = true
}
