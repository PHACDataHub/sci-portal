resource "google_project_service" "gke_hub_api" {
  project = var.project_id
  service = "gkehub.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "acm_api" {
  project = var.project_id
  service = "anthosconfigmanagement.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}


resource "google_project_service" "anthos_api" {
  project = var.project_id
  service = "anthos.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}


resource "google_project_service" "cloudsql_api" {
  project = var.project_id
  service = "sqladmin.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "server_networking" {
  project = var.project_id
  service = "servicenetworking.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "serviceusage_api" {
  project = var.project_id
  service = "serviceusage.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "cloudbilling_api" {
  project = var.project_id
  service = "cloudbilling.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}

resource "google_project_service" "cloudfunction_api" {
  project = var.project_id
  service = "cloudfunctions.googleapis.com"

  timeouts {
    create = "30m"
    update = "40m"
  }

  disable_dependent_services = true
}