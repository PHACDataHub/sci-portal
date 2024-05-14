/**
See the following documentation for how to connect GCP cloud build to a private GitHub repository
https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github?generation=2nd-gen#connecting_a_github_host_programmatically
*/

resource "google_secret_manager_secret" "github_token_secret" {
  project   = var.project
  secret_id = "github-pat"

  replication {
    user_managed {
      replicas {
        location = "northamerica-northeast1"
      }
      replicas {
        location = "northamerica-northeast2"
      }
    }
  }
}

resource "google_secret_manager_secret_version" "github_token_secret_version" {
  secret      = google_secret_manager_secret.github_token_secret.id
  secret_data = var.github_pat
}

data "google_project" "project" {
}

data "google_iam_policy" "serviceagent_secretAccessor" {
  binding {
    role    = "roles/secretmanager.secretAccessor"
    members = ["serviceAccount:service-${data.google_project.project.number}@gcp-sa-cloudbuild.iam.gserviceaccount.com"]
  }
}

resource "google_secret_manager_secret_iam_policy" "policy" {
  project     = google_secret_manager_secret.github_token_secret.project
  secret_id   = google_secret_manager_secret.github_token_secret.secret_id
  policy_data = data.google_iam_policy.serviceagent_secretAccessor.policy_data
}

resource "google_cloudbuildv2_connection" "my_connection" {
  project  = var.project
  location = local.region
  name     = "project-repo-connection"
  github_config {
    app_installation_id = var.github_cloudbuild_installation_id
    authorizer_credential {
      oauth_token_secret_version = google_secret_manager_secret_version.github_token_secret_version.id
    }
  }
  depends_on = [google_secret_manager_secret_iam_policy.policy]
}

resource "google_cloudbuildv2_repository" "my-repository" {
  name              = "R-Epi-analytics-template"
  parent_connection = google_cloudbuildv2_connection.my_connection.id
  remote_uri        = var.cloudbuild_repo
}


resource "google_cloudbuild_trigger" "rstudio-image-trigger" {
  name     = "rstudio-image-build"
  location = local.region

  repository_event_config {
    repository = google_cloudbuildv2_repository.my-repository.id
    push {
      tag = "^rstudio.*"
    }
  }

  filename = "rstudio/cloudbuild.yaml"
}
