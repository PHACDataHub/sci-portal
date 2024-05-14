# Logging and Monitoring

This document outlines the practices the project follows around logging and metrics alerting.

## How Metrics are Defined

This section explains how log-based metrics and notifications are set up in this project, using a log-based metric that counts IAM changes on storage bucket resources as an example.

![monitoring-diagram](./diagrams/gcs-bucket-alert-policy.svg)

### 1. Create a notification channel.

Use Terraform to create a [notification channel](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/monitoring_notification_channel) that is dedicated to receiving alerts for security changes. 


```hcl
resource "google_monitoring_notification_channel" "email_notification_channel" {
  type         = "email"
  labels = {
    email_address = "your-email@example.com"
  }
  force_delete = false
}
```

### 2. Define a metric based on the logs

Define a counter [logging metric](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/logging_metric) to track security changes in GCS buckets. The logs are filtered for resource type 'gcs_bucket' and specifically for 'storage.setIamPermissions' method in the payload.

```hcl
resource "google_logging_metric" "iam_changes_metric" {
  name      = "iam-changes-metric"
  filter    = "resource.type=gcs_bucket AND protoPayload.methodName='storage.setIamPermissions'"
  metric_descriptor {
    value_type = "INT64"
    metric_kind = "DELTA"
  }
}
```

### 3. Create a metric-based alert policy

Create a monitoring [alert policy](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/monitoring_alert_policy) to trigger when the counter metric is greater than 0 at any instant.

```hcl
resource "google_monitoring_alert_policy" "metrics_alert_policy" {
  display_name = "GCS IAM Monitoring Policy"
  combiner     = "OR"
  conditions {
    display_name = "IAM Changes on GCS"
    condition_threshold {
      filter = "metric.type=\"logging.googleapis.com/user/${google_logging_metric.iam_changes_metric.name}\" AND resource.type=\"gcs_bucket\""
      duration = "0s"
      comparison = "COMPARISON_GT"
      threshold_value = 0
    }
  }
  notification_channels = [google_monitoring_notification_channel.email_notification.id]
}
```

## Project-Specific Metrics

1. **IAM Changes to Storage Buckets**: The purpose of this security control is to get immediate visibility when any important IAM changes happen to GCS buckets.


## Log Sinks

A [logging sink](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/logging_project_sink) resource is created to persist all logs with `severity >= WARNING` in a separate storage bucket. A [lifecycle rule](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/storage_bucket#example-usage---life-cycle-settings-for-storage-bucket-objects) can be added to the logging bucket to specify a retention policy for these logs, if required.