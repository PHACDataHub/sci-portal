resource "google_compute_network" "phac_network" {
  project                 = var.project_id
  name                    = "phac-network"
  auto_create_subnetworks = false
}

resource "google_compute_global_address" "private_ip_address" {
  provider = google-beta

  name          = "backstage-cloudsql-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.phac_network.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  provider   = google-beta
  depends_on = [google_project_service.server_networking]

  network                 = google_compute_network.phac_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

resource "google_compute_subnetwork" "phac_subnet" {
  project       = var.project_id
  name          = "phac-subnet"
  region        = local.region
  network       = google_compute_network.phac_network.self_link
  ip_cidr_range = "10.0.0.0/23"

  secondary_ip_range {
    range_name    = "gke-01-pods"
    ip_cidr_range = "10.0.2.0/23"
  }

  secondary_ip_range {
    range_name    = "gke-02-services"
    ip_cidr_range = "10.0.4.0/23"
  }

}