resource "google_monitoring_notification_channel" "email_notification_channel" {
  project = var.project
  type    = "email"
  labels = {
    email_address = var.notification_channels_email
  }
  force_delete = false
}

resource "google_logging_metric" "iam_changes_counter_metric" {
  project = var.project
  name    = "iam_changes_counter"
  filter  = "resource.type=gcs_bucket AND protoPayload.methodName=\"storage.setIamPermissions\""
  metric_descriptor {
    value_type  = "INT64"
    metric_kind = "DELTA"
  }
}

resource "google_monitoring_alert_policy" "metrics_alert_policy" {
  project      = var.project
  display_name = "GCS Bucket IAM Monitoring Policy"
  combiner     = "OR"
  conditions {
    display_name = "IAM Changes Alert on GCS Bucket"
    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.iam_changes_counter_metric.name}\" AND resource.type=\"gcs_bucket\""
      duration        = "0s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0
    }
  }
  notification_channels = [google_monitoring_notification_channel.email_notification_channel.id]
  documentation {
    subject = "Change detected in bucket IAM"
    content = <<EOF
    One or more IAM changes was detected on the bucket indicated in this email.
    If this activity is unrecognized, please follow up immediately. 
    EOF
  }
  depends_on = [google_logging_metric.iam_changes_counter_metric]
}
