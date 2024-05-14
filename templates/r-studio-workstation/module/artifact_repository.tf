locals {
  repository_id = "analytics-template"
}

resource "google_artifact_registry_repository" "project-image-repository" {
  location      = local.region
  repository_id = local.repository_id
  description   = "Docker repository for this project."
  format        = "DOCKER"
}
