import { Table } from '@google-cloud/bigquery';
import { bigqueryClient, budgetClient } from './clients';
import { config } from './config';
import { writeFileSync, unlinkSync } from 'fs';
import { google } from '@google-cloud/billing-budgets/build/protos/protos';

const getBudgetUsageQuery = `
SELECT project_id, total_cost, amount as budget_limit, (total_cost*100/amount) as budget_consumed, currencyCode as currency_code, CURRENT_TIMESTAMP() AS current_time FROM (
SELECT project_id, SUM(t0_qt_mnecho490c) AS total_cost FROM (
  SELECT project_id, SUM(clmn0_) AS t0_qt_mnecho490c, clmn3_ AS t0_qt_nnecho490c FROM (
  SELECT project_id, SAFE_CAST(DATETIME_TRUNC(clmn2_, SECOND) AS DATE) AS clmn3_, SAFE_CAST(DATETIME_TRUNC(clmn2_, SECOND) AS DATE) AS clmn4_, clmn0_, clmn1_ FROM (
    SELECT project_id, SAFE_CAST(clmn1_ AS DATETIME) AS clmn2_, clmn0_, clmn1_ FROM (
      SELECT t0.project.id AS project_id, t0.cost AS clmn0_, t0.usage_start_time AS clmn1_ FROM \`${config.bigquery.budgetExports.tables.exported.fullPath}\` AS t0)
      )
    )
    WHERE (clmn1_ >= @StartBillingDate AND clmn1_ < TIMESTAMP_ADD( @Today, INTERVAL 1 DAY)) GROUP BY project_id, t0_qt_nnecho490c
    ORDER BY t0_qt_nnecho490c ASC
    LIMIT 2000000
    )
    GROUP BY project_id
  )
INNER JOIN \`${config.bigquery.budgets.tables.budget.fullPath}\` as budget ON budget.projectId=project_id;
`;

const checkBudgetExistsQuery = `
SELECT name
FROM \`${config.bigquery.budgets.tables.budget.fullPath}\`
WHERE name = @budgetName
LIMIT 1
`;

const fetchBudgetUsageQuery = `
SELECT *
FROM \`${config.bigquery.budgets.tables.budgetUsage.fullPath}\`
WHERE projectId = @Id
`;

const fetchBudgetAllUsageQuery = `
SELECT *
FROM \`${config.bigquery.budgets.tables.budgetUsage.fullPath}\`
LIMIT 10000;
`;

/**
 * Interface representing usage details for a project.
 */
export interface Usage {
  projectId: string;
  totalCost: number;
  budgetLimit: number;
  budgetConsumed: number;
  currencyCode: string;
  lastSync: string;
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

/**
 * Generates budget usages for projects up to the current date.
 *
 * @param today - The current date.
 * @returns A promise that resolves to an array of `Usage` objects.
 * @throws Will throw an error if there is an issue fetching the budget usage.
 */
export async function generateBudgetUsages(today: Date): Promise<Usage[]> {
  try {
    const dataset = bigqueryClient.dataset(
      config.bigquery.budgetExports.dataset,
    );
    const table = dataset.table(
      config.bigquery.budgetExports.tables.exported.name,
    );
    const [queryResult] = await table.query({
      query: getBudgetUsageQuery,
      params: {
        StartBillingDate: startOfYear(today).toISOString(),
        Today: today.toISOString(),
      },
    });

    return queryResult.map(
      (row: any): Usage => ({
        projectId: row.project_id,
        totalCost: row.total_cost,
        budgetLimit: row.budget_limit,
        budgetConsumed: row.budget_consumed,
        currencyCode: row.currency_code,
        lastSync: row.current_time.value,
      }),
    );
  } catch (error) {
    console.error(error);
    throw new Error(`Error fetching budget usage`);
  }
}

/**
 * Converts JSON data to CSV format with specified column order.
 *
 * @param jsonData - The JSON data to convert to CSV.
 * @param order - The order in which the columns should appear in the CSV.
 * @returns A string representing the CSV data.
 */
function jsonToCsvWithOrder(jsonData: any[], order: string[]): string {
  const csvRows: string[] = [];

  const headers = Object.keys(jsonData[0]);
  csvRows.push(headers.join(','));

  // Add data rows in the specified order
  for (const obj of jsonData) {
    const row = order.map(key => obj[key]);
    csvRows.push(row.join(','));
  }

  // Combine all rows into a single string
  return csvRows.join('\n');
}

/**
 * Saves budget usages data to a CSV file and syncs it with BigQuery.
 *
 * @param budgetUsages - An array of `Usage` objects representing budget usages.
 * @throws Will throw an error if there is an issue saving or syncing the data.
 */
export async function saveBudgetUsages(budgetUsages: Usage[]) {
  // Skip if there are no budget usages
  if (!budgetUsages || budgetUsages.length === 0) {
    return;
  }

  const order = [
    'projectId',
    'totalCost',
    'budgetLimit',
    'budgetConsumed',
    'currencyCode',
    'lastSync',
  ];

  const csvData = jsonToCsvWithOrder(budgetUsages, order);
  writeFileSync('./temp_data.csv', csvData);

  const options = {
    sourceFormat: 'CSV',
    skipLeadingRows: 1,
    location: config.gcp.region,
    writeDisposition: 'WRITE_TRUNCATE',
  };

  try {
    const dataset = bigqueryClient.dataset(config.bigquery.budgets.dataset);
    const table = dataset.table(
      config.bigquery.budgets.tables.budgetUsage.name,
    );
    table.createLoadJob('./temp_data.csv', options, async (err, job) => {
      if (err) {
        console.error(
          'Error in creating load syncBudgetsUsages job: ',
          err.message,
        );
      }
      await job?.exists(() => {
        unlinkSync('./temp_data.csv');
      });
    });
  } catch (error) {
    console.error(error);
    throw new Error(`Error processing job for syncing budget usage`);
  }
}

/**
 * Fetches and syncs new budgets from the budget client and inserts them into a BigQuery table if they don't already exist.
 */
export async function fetchAndSyncNewBudgets() {
  // Get the dataset and table references from the config
  const dataset = bigqueryClient.dataset(config.bigquery.budgets.dataset);
  const table = dataset.table(config.bigquery.budgets.tables.budget.name);

  try {
    // DEBUGGING SA used to make requests
    const saToken = await bigqueryClient.authClient.getCredentials();
    console.log('SA EMAIL:', saToken.client_email);

    const [budgets] = await budgetClient.listBudgets({
      parent: config.billing.accountId,
    });

    for (const budget of budgets) {
      try {
        const budgetExists = await checkIfBudgetExists(table, budget.name!);
        if (!budgetExists) {
          console.log(`Inserting new budget: ${budget.displayName}`);
          await insertBudget(table, budget);
        }
      } catch (error) {
        console.error(`Error processing budget ${budget.displayName}:`, error);
      }
    }
  } catch (error) {
    console.error('Error fetching and syncing budgets:', error);
    throw error;
  }
}

/**
 * Checks if a budget with the given ID exists in the specified table.
 * @param {object} table - The BigQuery table object.
 * @param {string} budgetId - The ID of the budget.
 * @returns {Promise<boolean>} -  Resolves to true if the budget exists.
 */
async function checkIfBudgetExists(table: Table, budgetName: string) {
  try {
    const [queryResult] = await table.query({
      query: checkBudgetExistsQuery,
      params: { budgetName: budgetName },
    });
    return queryResult.length > 0;
  } catch (error) {
    console.error(`Error checking if budget exists for ${budgetName}:`, error);
    throw error;
  }
}

/**
 * Inserts a new budget into the specified table.
 * @param {object} table - The BigQuery table object.
 * @param {object} budget - The budget object to insert.
 * @returns {Promise<void>} - A promise that resolves when the budget is inserted.
 */
async function insertBudget(
  table: Table,
  budget: google.cloud.billing.budgets.v1.IBudget,
) {
  // Prepare the budget data for insertion
  const budgetData = {
    name: budget.name,
    projectId: budget.displayName,
    amount: budget.amount?.specifiedAmount?.units
      ? parseFloat(String(budget.amount.specifiedAmount.units))
      : 0,
    currencyCode: budget.amount?.specifiedAmount?.currencyCode,
  };

  try {
    // Insert the budget data into the table
    await table.insert([budgetData]);
    console.log(`Successfully inserted budget ${budget.displayName}`);
  } catch (error) {
    // Log error for the budget insertion
    console.error(`Error inserting budget ${budget.displayName}:`, error);
    throw error;
  }
}

/**
 * Fetches all synced budget usage data from BigQuery.
 *
 * @returns A promise that resolves to the fetched budget usage data.
 * @throws Will throw an error if there is an issue fetching the data.
 */
export async function fetchSyncedBudgetUsages(): Promise<Usage[]> {
  try {
    const dataset = bigqueryClient.dataset(config.bigquery.budgets.dataset);
    const table = dataset.table(
      config.bigquery.budgets.tables.budgetUsage.name,
    );
    const [queryResult] = await table.query({
      query: fetchBudgetAllUsageQuery,
      params: {},
    });

    return queryResult.map(
      (row: any): Usage => ({
        projectId: row.projectId,
        totalCost: row.totalCost,
        budgetLimit: row.budgetLimit,
        budgetConsumed: row.budgetConsumed,
        currencyCode: row.currencyCode,
        lastSync: row.lastSync,
      }),
    );
  } catch (error) {
    console.error(error);
    throw new Error(`Error fetching synced budget usages`);
  }
}

/**
 * Fetches budget usage data for a specific project from BigQuery.
 *
 * @param projectId - The ID of the project to fetch budget usage for.
 * @returns A promise that resolves to the fetched budget usage data for the specified project.
 * @throws Will throw an error if there is an issue fetching the data.
 */
export async function fetchSyncedBudgetUsage(
  projectId: string,
): Promise<Usage | undefined> {
  try {
    const dataset = bigqueryClient.dataset(config.bigquery.budgets.dataset);
    const table = dataset.table(
      config.bigquery.budgets.tables.budgetUsage.name,
    );
    const [queryResult] = await table.query({
      query: fetchBudgetUsageQuery,
      params: {
        Id: projectId,
      },
    });

    if (queryResult.length === 0) {
      return undefined;
    }

    const firstUsage = queryResult.map(
      (row: any): Usage => ({
        projectId: row.projectId,
        totalCost: row.totalCost,
        budgetLimit: row.budgetLimit,
        budgetConsumed: row.budgetConsumed,
        currencyCode: row.currencyCode,
        lastSync: row.lastSync,
      }),
    )[0];

    return firstUsage;
  } catch (error) {
    console.error(error);
    throw new Error(`Error fetching budget usage for project: ${projectId}`, {
      cause: 500,
    });
  }
}
