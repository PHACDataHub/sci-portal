resource "google_dns_managed_zone" "backstage_zone" {
  project     = var.project_id
  name        = "backstage-managed-zone"
  dns_name    = "backstage.alpha.phac-aspc.gc.ca."
  description = "Backstage DNS Zone for PHAC alpha DNS"
  visibility  = "public"

  cloud_logging_config {
    enable_logging = true
  }
}

resource "google_dns_record_set" "backstage_A_record" {
  project = var.project_id
  name    = "backstage.alpha.phac-aspc.gc.ca."
  type    = "A"
  ttl     = 300

  managed_zone = google_dns_managed_zone.backstage_zone.name

  rrdatas = [google_compute_address.backstage_ip.address]
}
