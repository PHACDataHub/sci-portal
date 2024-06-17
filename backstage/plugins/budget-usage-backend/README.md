# budget-usage

The `budget-usage` plugin provides data for the **Cost** and **% Budget** columns displayed in the Catalog at a new route, `/api/budget-usage`. The following endpoints are available:

| Request                   | Description                                                           |
| ------------------------- | --------------------------------------------------------------------- |
| `POST /sync`              | Calculates and saves the **% Budget** from the latest available data. |
| `GET /usages`             | Returns all budget usage.                                             |
| `GET /usages/:project-id` | Returns the budget usage data for a project.                          |
| `GET /health`             | Returns the service health. |

## Usage

### Authentication

To use the API you must to provide a Backstage user token, or a static API key defined in `app-config.yaml`. For example:

```yaml
auth:
   externalAccess:
    - type: static
    options:
        token: ${BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN} # STATIC TOKEN
        subject: budget-alert-events
```

The following is an example request:

```
curl -X POST \
  -H "Authorization: Bearer <user-token | static-token>" \
  http://localhost:7007/api/budget-usage/sync
```

## Design

### IAM Permissions

The `/sync` endpoint fetches a list of budgets from the Billing Account and updates data in BigQuery. The Service Account making the request must have the following roles:

| Role                        | Reason                                      |
| --------------------------- | ------------------------------------------- |
| `roles/billing.viewer`      | Used to query the budgets                   |
| `roles/bigquery.dataOwner`  | Used to update BigQuery tables              |
| `roles/bigquery.jobUser`    | Used to run BigQuery jobs for data syncing. |

> [!TIP]
> Since a Billing Accounts can be linked to multiple Folders and Projects in an Organization, modify the Billing Account IAM permissions from the Billing page, `https://console.cloud.google.com/billing/<billing-id>/manage`). Inspect, edit, delete permissions on **Account management** page, or select **Add Principal** to grant new access.

### BigQuery Datasets and Tables

The plugin interacts with two datasets in BigQuery: `billing_daily_costs`, and `billing_budgets_usages`. Here's a breakdown of the datasets and their tables:

### `billing_daily_costs` Dataset

This dataset contains the Billing Account daily export.

### `billing_budgets_usages` Dataset

This dataset contains the budget and usage data.

#### `budgets` Table

This table contains the exported budget data.

| Name | Type | Mode | Description |
|--------------|---------|------------|-----------------------------|
| `name` | STRING | REQUIRED | Budget name |
| `projectId` | STRING | REQUIRED | GCP project ID |
| `amount` | FLOAT | REQUIRED | Maximum annual budget amount (in CAD) |
| `currencyCode` | STRING | REQUIRED | Budget currency code |

#### `usages` Table

This table contains calculated budget usage data.

| Name | Type | Mode | Description |
|--------------|---------|------------|---------------------------------|
| `projectId` | STRING | REQUIRED | Project ID |
| `totalCost` | FLOAT | REQUIRED | Current total cost |
| `budgetLimit`| FLOAT | REQUIRED | Maximum budget amount |
| `budgetConsumed` | FLOAT | REQUIRED | Total percentage of budget consumed |
| `currencyCode` | STRING | REQUIRED | Budget currency code |
| `lastSync` | STRING | REQUIRED | Last sync time |

## Getting Started

To get started with this configuration, follow these steps:

1. **Set Environment Variables**:
   Ensure the required environment variables are set in your environment. See the project's documentation for details.

2. **Install Dependencies**:
   Install the necessary dependencies using yarn:

   ```bash
   yarn install
   ```

3. **Start API**:
   Start the express server by running the following command

   ```bash
   task backstage:budget-backend-dev
   ```

> [!IMPORTANT]  
> You will need to use a GCP Service Account key by exporting it to `GOOGLE_APPLICATION_CREDENTIALS` environment variable. If not provided, BigQuery and Budget clients will not work.
