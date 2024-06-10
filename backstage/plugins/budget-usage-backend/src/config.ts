const {
  GCP_PROJECT_ID,
  GCP_REGION,
  GCP_BILLING_ACCOUNT_ID,
  BIG_QUERY_BUDGET_EXPORT_DATASET,
  BIG_QUERY_BUDGET_EXPORT_DATASET_TABLE,
  BIG_QUERY_BUDGET_DATASET,
  BIG_QUERY_BUDGET_DATASET_BUDGET_TABLE,
  BIG_QUERY_BUDGET_DATASET_BUDGET_USAGE_TABLE,
} = process.env as { [key: string]: string | undefined };

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

if (!BIG_QUERY_BUDGET_EXPORT_DATASET) {
  throw new Error(
    'Missing required environment variable: BIG_QUERY_BUDGET_EXPORT_DATASET',
  );
}

if (!BIG_QUERY_BUDGET_EXPORT_DATASET_TABLE) {
  throw new Error(
    'Missing required environment variable: BIG_QUERY_BUDGET_EXPORT_DATASET_TABLE',
  );
}

if (!BIG_QUERY_BUDGET_DATASET) {
  throw new Error(
    'Missing required environment variable: BIG_QUERY_BUDGET_DATASET',
  );
}

if (!BIG_QUERY_BUDGET_DATASET_BUDGET_TABLE) {
  throw new Error(
    'Missing required environment variable: BIG_QUERY_BUDGET_DATASET_BUDGET_TABLE',
  );
}
if (!BIG_QUERY_BUDGET_DATASET_BUDGET_USAGE_TABLE) {
  throw new Error(
    'Missing required environment variable: BIG_QUERY_BUDGET_DATASET_BUDGET_USAGE_TABLE',
  );
}

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
      dataset: BIG_QUERY_BUDGET_EXPORT_DATASET,
      tables: {
        exported: {
          name: BIG_QUERY_BUDGET_EXPORT_DATASET_TABLE,
          fullPath: `${BIG_QUERY_BUDGET_EXPORT_DATASET}.${BIG_QUERY_BUDGET_EXPORT_DATASET_TABLE}`,
        },
      },
    },
    budgets: {
      dataset: BIG_QUERY_BUDGET_DATASET,
      tables: {
        budget: {
          name: BIG_QUERY_BUDGET_DATASET_BUDGET_TABLE,
          fullPath: `${BIG_QUERY_BUDGET_DATASET}.${BIG_QUERY_BUDGET_DATASET_BUDGET_TABLE}`,
        },
        budgetUsage: {
          name: BIG_QUERY_BUDGET_DATASET_BUDGET_USAGE_TABLE,
          fullPath: `${BIG_QUERY_BUDGET_DATASET}.${BIG_QUERY_BUDGET_DATASET_BUDGET_USAGE_TABLE}`,
        },
      },
    },
  },
};
