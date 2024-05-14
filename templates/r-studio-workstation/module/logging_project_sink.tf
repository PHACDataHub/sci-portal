locals {
  logging_project_sink_name = "epi-analytics-log-sink"
}

resource "google_logging_project_sink" "logging_project_sink" {
  project                = var.project
  name                   = local.logging_project_sink_name
  destination            = "storage.googleapis.com/${google_storage_bucket.logging-bucket.name}"
  filter                 = "severity >= WARNING"
  unique_writer_identity = true
}

# Because our sink uses a unique_writer, we must grant that writer access to the bucket.
resource "google_project_iam_binding" "gcs-bucket-writer" {
  project = var.project
  role    = "roles/storage.objectCreator"

  members = [
    google_logging_project_sink.logging_project_sink.writer_identity,
  ]
}
