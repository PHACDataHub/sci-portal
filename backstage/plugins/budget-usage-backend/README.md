# budget-usage

The `budget-usage` plugin is used for syncing billing budget usage. It extends the Backstage API and adds the following endpoints under the `/api/budget-usage` path:

## Endpoints

- **Health Check**: `GET /health` - A simple endpoint for checking the health status of the service.
- **Sync Budgets**: `POST /sync` - Fetches and syncs new budgets, generates budget usages, and saves them.
- **Get All Budget Usages**: `GET /usages` - Retrieves all synced budget usages.
- **Get Budget Usage by Project ID**: `GET /usages/:id` - Retrieves budget usage data for a specific project ID.

### Authentication

> [!IMPORTANT]  
> To successfully make requests to the API, you need to provide either a Backstage user token or a static API key defined in `app-config.yaml`.
```yaml
auth:
externalAccess:
    - type: static
    options:
        token: ${BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN} # STATIC TOKEN
        subject: budget-alert-events
```

## BigQuery Datasets and Tables

The plugin interacts with two main datasets in BigQuery: `billing_daily_costs` and `billing_budgets_usages`. Here's a breakdown of the datasets and their tables:

### `billing_daily_costs` Dataset

- **Dataset ID**: `billing_daily_costs`
- **Description**: Billing dataset exported by Google.

### `billing_budgets_usages` Dataset

- **Dataset ID**: `billing_budgets_usages`
- **Description**: Dataset that houses the billing budget and usage data.

#### Tables

1. **`budgets` Table**:
   - **Table ID**: `budgets`
   - **Description**: Table for storing exported budget data.
   - **Schema**:
     | Name         | Type    | Mode       | Description                 |
     |--------------|---------|------------|-----------------------------|
     | `name`       | STRING  | REQUIRED   | Budget name                 |
     | `projectId`  | STRING  | REQUIRED   | GCP project ID              |
     | `amount`     | FLOAT   | REQUIRED   | Maximum annual budget amount (in CAD) |
     | `currencyCode` | STRING | REQUIRED | Budget currency code         |

2. **`usages` Table**:
   - **Table ID**: `usages`
   - **Description**: Table for storing budget usage data.
   - **Schema**:
     | Name         | Type    | Mode       | Description                     |
     |--------------|---------|------------|---------------------------------|
     | `projectId`  | STRING  | REQUIRED   | Project ID                      |
     | `totalCost`  | FLOAT   | REQUIRED   | Current total cost              |
     | `budgetLimit`| FLOAT   | REQUIRED   | Maximum budget amount           |
     | `budgetConsumed` | FLOAT | REQUIRED | Total percentage of budget consumed |
     | `currencyCode` | STRING | REQUIRED | Budget currency code             |
     | `lastSync`   | STRING  | REQUIRED   | Last sync time                  |

## Getting Started

To get started with this configuration, follow these steps:

1. **Set Environment Variables**:
   Ensure the required environment variables are set in your environment. See the project's documentation for details.

2. **Install Dependencies**:
   Install the necessary dependencies using yarn:

   ```bash
   yarn install

3. **Start API**:
   Start the express server by running the following command

   ```bash
   task backstage:budget-backend-dev
   ```