data "google_client_config" "default" {}

provider "kubernetes" {
  host                   = "https://${module.gke.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(module.gke.ca_certificate)
}

provider "kubectl" {
  host                   = "https://${module.gke.endpoint}"
  cluster_ca_certificate = base64decode(module.gke.ca_certificate)
  token                  = data.google_client_config.default.access_token
  load_config_file       = false
}

provider "helm" {
  kubernetes {
    host                   = "https://${module.gke.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(module.gke.ca_certificate)
  }
}

provider "google-beta" {
  project     = var.project_id
  region      = local.region
}


resource "google_compute_network" "phac_network" {
  project                 = var.project_id
  name                    = "phac-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "phac_subnet" {
  project = var.project_id
  name          = "phac-subnet"
  region        = local.region
  network       = google_compute_network.phac_network.self_link
  ip_cidr_range = "10.0.0.0/24"

  secondary_ip_range {
    range_name    = "gke-01-pods"
    ip_cidr_range = "10.0.1.0/24"
  }

  secondary_ip_range {
    range_name    = "gke-02-services"
    ip_cidr_range = "10.0.2.0/24"
  }

  secondary_ip_range {
    range_name    = "gke-03-extend"
    ip_cidr_range = "10.0.3.0/24"
  }

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
  release_channel            = "REGULAR"
  deletion_protection        = false
}

resource "google_service_account" "phac-backstage-kcc-sa" {
  account_id   = local.kcc_props.sa_account_id
  display_name = local.kcc_props.sa_display_name
  project      = var.project_id
  description  = "GCP SA bound to K8S SA ${var.project_id}[phac-backstage-kcc-sa]	"
}

# Allows the GKE Service Account to use the GCP Service Account via Workload Identity
resource "google_service_account_iam_member" "iam_workloadidentity" {
  service_account_id = google_service_account.phac-backstage-kcc-sa.name
  role               = "roles/iam.workloadIdentityUser"

  # Workload Identity is specified per-project and per-namespace
  member = "serviceAccount:${var.project_id}.svc.id.goog[cnrm-system/cnrm-controller-manager]"
}

resource "google_project_iam_member" "editor_role" {
  project = var.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.phac-backstage-kcc-sa.email}"
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
  sync_repo     = local.git_props.sync_repo
  sync_branch   = local.git_props.sync_branch
  policy_dir    = local.git_props.sync_root_dir
}