resource "google_sql_database_instance" "instance" {
  provider = google-beta

  name                = local.cloudsql.instance_name
  region              = local.region
  database_version    = local.cloudsql.database_version
  deletion_protection = local.cloudsql.deletion_protection

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = local.cloudsql.database_tier
    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.phac_network.id
      enable_private_path_for_google_cloud_services = true
    }
  }
}