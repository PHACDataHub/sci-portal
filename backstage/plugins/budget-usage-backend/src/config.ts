const { GCP_PROJECT_ID, GCP_REGION, GCP_BILLING_ACCOUNT_ID } = process.env as {
  [key: string]: string | undefined;
};

if (!GCP_PROJECT_ID) {
  throw new Error('Missing required environment variable: GCP_PROJECT_ID');
}

if (!GCP_REGION) {
  throw new Error('Missing required environment variable: GCP_REGION');
}

if (!GCP_BILLING_ACCOUNT_ID) {
  throw new Error(
    'Missing required environment variable: GCP_BILLING_ACCOUNT_ID',
  );
}

/* Allow the BigQuery datasets and tables to be configured, if necessary */

// The Billing Account export is configured with click-ops at the org-level.
const BILLING_ACCOUNT_EXPORT_DATASET =
  process.env.BILLING_ACCOUNT_EXPORT_DATASET || 'billing_daily_costs';
const BILLING_ACCOUNT_EXPORT_DATASET_TABLE =
  process.env.BILLING_ACCOUNT_EXPORT_DATASET_TABLE || 'billing-export-view';

// The budget usage datasets and tables are defined in bootstrap/bigquery.tf.
const BUDGET_USAGE_DATASET =
  process.env.BUDGET_USAGE_DATASET || 'billing_budgets_usages';
const BUDGET_USAGE_DATASET_BUDGET_TABLE =
  process.env.BUDGET_USAGE_DATASET_BUDGET_TABLE || 'budgets';
const BUDGET_USAGE_DATASET_BUDGET_USAGE_TABLE =
  process.env.BUDGET_USAGE_DATASET_BUDGET_USAGE_TABLE || 'usages';

export const config = {
  gcp: {
    projectId: GCP_PROJECT_ID,
    region: GCP_REGION,
  },
  billing: {
    accountId: `billingAccounts/${GCP_BILLING_ACCOUNT_ID}`,
  },

  bigquery: {
    budgetExports: {
      dataset: BILLING_ACCOUNT_EXPORT_DATASET,
      tables: {
        exported: {
          name: BILLING_ACCOUNT_EXPORT_DATASET_TABLE,
          fullPath: `${BILLING_ACCOUNT_EXPORT_DATASET}.${BILLING_ACCOUNT_EXPORT_DATASET_TABLE}`,
        },
      },
    },
    budgets: {
      dataset: BUDGET_USAGE_DATASET,
      tables: {
        budget: {
          name: BUDGET_USAGE_DATASET_BUDGET_TABLE,
          fullPath: `${BUDGET_USAGE_DATASET}.${BUDGET_USAGE_DATASET_BUDGET_TABLE}`,
        },
        budgetUsage: {
          name: BUDGET_USAGE_DATASET_BUDGET_USAGE_TABLE,
          fullPath: `${BUDGET_USAGE_DATASET}.${BUDGET_USAGE_DATASET_BUDGET_USAGE_TABLE}`,
        },
      },
    },
  },
};
