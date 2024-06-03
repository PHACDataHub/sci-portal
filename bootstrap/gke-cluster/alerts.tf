resource "google_storage_bucket" "budget_alert_cloud_function_package" {
  name                        = "budget_alert_cloud_function_package"
  location                    = "northamerica-northeast2"
  storage_class               = "STANDARD"
  force_destroy               = true
  uniform_bucket_level_access = true
}


resource "google_pubsub_topic" "science_portal_budget_alert" {
  name = "science_portal_budget_alert"
}


data "archive_file" "function_zip" {
  type        = "zip"
  source_dir  = "../../budget-alerts" # Path to your function code directory
  output_path = "./budget_alerts.zip"
}


resource "google_storage_bucket_object" "budget_alerts_zip_object" {
  name   = "budget_alerts.zip"
  bucket = google_storage_bucket.budget_alert_cloud_function_package.name
  source = data.archive_file.function_zip.output_path
}


resource "google_cloudfunctions_function" "science_portal_budget_alert_function" {
  name        = "science_portal_budget_alert_function"
  description = "Pub/Sub triggered function to initiate notifications based on budget alert"
  runtime     = "nodejs20"
  region      = "northamerica-northeast1"

  entry_point = "sendBudgetAlerts" # Entry point in index.js

  source_archive_bucket = google_storage_bucket_object.budget_alerts_zip_object.bucket
  source_archive_object = google_storage_bucket_object.budget_alerts_zip_object.name

  event_trigger {
    event_type = "google.pubsub.topic.publish"
    resource   = google_pubsub_topic.science_portal_budget_alert.name
  }


  environment_variables = {
    GC_NOTIFY_API_KEY                   = var.gc_notify_api_key
    GC_NOTIFY_ALERT_TEMPLATE_ID         = var.gc_notify_alert_template_id
    GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID   = var.gc_notify_over_budget_template_id
    BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN = var.backstage_budget_alert_events_token
    GC_NOTIFY_URI                       = var.gc_notify_uri
    BACKSTAGE_URI                       = var.backstage_uri
  }

}