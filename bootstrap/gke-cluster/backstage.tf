resource "google_service_account" "phac-backstage-sa" {
  account_id   = local.backstage_props.sa_account_id
  display_name = local.backstage_props.sa_display_name
  project      = var.project_id
  description  = "GCP SA bound to K8S SA ${var.project_id}[phac-backstage-sa]	"
}

resource "google_service_account" "dns01-solver" {
  account_id   = "dns01-solver"
  display_name = "dns01-solver"
  project      = var.project_id
  description  = "GCP SA to complete DNS01 challenge for cert-manager"
}

resource "google_project_iam_member" "dnsadmin_role" {
  project = var.project_id
  role    = "roles/dns.admin"
  member  = "serviceAccount:${google_service_account.dns01-solver.email}"
}

resource "google_project_iam_member" "backstage_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.phac-backstage-sa.email}"
}

# Allows the GKE Service Account to use the GCP Service Account via Workload Identity
resource "google_service_account_iam_member" "iam_backstage_workloadidentity" {
  service_account_id = google_service_account.phac-backstage-sa.name
  role               = "roles/iam.workloadIdentityUser"

  # Workload Identity is specified per-project and per-namespace
  member = "serviceAccount:${var.project_id}.svc.id.goog[${local.backstage_props.gke_sa_name}]"
}

resource "google_service_account_iam_member" "iam_cert_manager_workloadidentity" {
  service_account_id = google_service_account.dns01-solver.name
  role               = "roles/iam.workloadIdentityUser"

  # Workload Identity is specified per-project and per-namespace
  member = "serviceAccount:${var.project_id}.svc.id.goog[cert-manager/cert-manager]"
}
