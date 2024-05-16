output "notebooks_googlemanaged_urls" {
  description = "Google Managed Notebook access URLs"
  value       = formatlist("https://console.cloud.google.com/vertex-ai/workbench/managed?project=%s", local.project.project_id)
}