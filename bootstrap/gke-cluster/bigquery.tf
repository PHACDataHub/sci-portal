resource "google_bigquery_dataset" "billing_budget_usages_dataset" {
  dataset_id    = "billing_budget_usages"
  friendly_name = "billing_budget_usages"
  description   = "Dataset that houses the billing budget and usage data"
  location      = local.region
}

resource "google_bigquery_table" "billing_budgets_table" {
  dataset_id          = google_bigquery_dataset.billing_budget_usages_dataset.dataset_id
  table_id            = "billing_budgets"
  deletion_protection = false
  schema              = <<EOF
[
  {
    "name": "name",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Budget name"
  },
  {
    "name": "projectId",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "GCP project id"
  },
  {
    "name": "amount",
    "type": "FLOAT",
    "mode": "REQUIRED",
    "description": "Maximum annual budget amount (in CAD)"
  },
  {
    "name": "currencyCode",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Budget currency code"
  }
]
EOF

}

resource "google_bigquery_table" "billing_budget_usages_table" {
  dataset_id          = google_bigquery_dataset.billing_budget_usages_dataset.dataset_id
  table_id            = "billing_budget_usages"
  deletion_protection = false
  schema              = <<EOF
[
  {
    "name": "projectId",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Project Id"
  },
  {
    "name": "totalCost",
    "type": "FLOAT",
    "mode": "REQUIRED",
    "description": "Current total cost"
  },
  {
    "name": "budgetLimit",
    "type": "FLOAT",
    "mode": "REQUIRED",
    "description": "Maxmium budget amount"
  },
  {
    "name": "budgetConsumed",
    "type": "FLOAT",
    "mode": "REQUIRED",
    "description": "Total % of budget consumed"
  },
    {
    "name": "currencyCode",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Budget currency code"
  },
    {
    "name": "lastSync",
    "type": "STRING",
    "mode": "REQUIRED",
    "description": "Last sync time"
  }
]
EOF

}
