resource "google_compute_router" "router" {
  name    = "${local.vpc_network_name}-router"
  project = var.project
  region  = local.region
  network = google_compute_network.vpc_network.id
}

resource "google_compute_router_nat" "nat" {
  name                   = "${local.vpc_network_name}-workstation-nat"
  project                = var.project
  router                 = google_compute_router.router.name
  region                 = google_compute_router.router.region
  nat_ip_allocate_option = "AUTO_ONLY"

  source_subnetwork_ip_ranges_to_nat = "LIST_OF_SUBNETWORKS"
  subnetwork {
    name                    = google_compute_subnetwork.workstation-subnetwork.id
    source_ip_ranges_to_nat = ["ALL_IP_RANGES"]
  }

  log_config {
    enable = true
    filter = "ALL"
  }
}
