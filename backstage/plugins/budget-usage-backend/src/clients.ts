import { BigQuery } from '@google-cloud/bigquery';
import { BudgetServiceClient } from '@google-cloud/billing-budgets';
import { config } from './config';

export const bigqueryClient = new BigQuery({
  projectId: config.gcp.projectId,
  location: config.gcp.region,
});

export const budgetClient = new BudgetServiceClient({
  projectId: config.gcp.projectId,
});
