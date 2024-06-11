import { bigqueryClient, budgetClient } from './clients';
import { config } from './config';
import { writeFileSync, unlinkSync } from 'fs';

const getBudgetUsageQuery = `
SELECT project_id, total_cost, amount as budget_limit, (total_cost*100/amount) as budget_consumed, currencyCode as currency_code, CURRENT_TIMESTAMP() AS current_time FROM (
SELECT project_id, SUM(t0_qt_mnecho490c) AS total_cost FROM (
  SELECT project_id, SUM(clmn0_) AS t0_qt_mnecho490c, clmn3_ AS t0_qt_nnecho490c FROM (
  SELECT project_id, SAFE_CAST(DATETIME_TRUNC(clmn2_, SECOND) AS DATE) AS clmn3_, SAFE_CAST(DATETIME_TRUNC(clmn2_, SECOND) AS DATE) AS clmn4_, clmn0_, clmn1_ FROM (
    SELECT project_id, SAFE_CAST(clmn1_ AS DATETIME) AS clmn2_, clmn0_, clmn1_ FROM (
      SELECT t0.project.id AS project_id, t0.cost AS clmn0_, t0.usage_start_time AS clmn1_ FROM \`${config.bigquery.budgetExports.tables.exported.fullPath}\` AS t0)
      )
    )
    WHERE (clmn1_ >= @StartBillingDate AND clmn1_ < TIMESTAMP_ADD( @Today, INTERVAL 1 DAY)) GROUP BY project_id, t0_qt_nnecho490c ORDER BY t0_qt_nnecho490c ASC LIMIT 2000000
    )
    GROUP BY project_id
  )
INNER JOIN \`${config.bigquery.budgets.tables.budget.fullPath}\` as budget ON budget.projectId=project_id;
`;

const checkBudgetExistsQuery = `
SELECT projectId
FROM \`${config.bigquery.budgets.tables.budget.fullPath}\`
WHERE projectId = @Id
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

function firstDateOfYear(date: Date): string {
  return new Date(date.getFullYear(), 0, 1).toISOString();
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
        StartBillingDate: firstDateOfYear(today),
        Today: today.toISOString(),
      },
    });

    return queryResult.map((projectBudgetUsage: any) => {
      const projectUsage: Usage = {
        projectId: projectBudgetUsage.project_id,
        totalCost: projectBudgetUsage.total_cost,
        budgetLimit: projectBudgetUsage.budget_limit,
        budgetConsumed: projectBudgetUsage.budget_consumed,
        currencyCode: projectBudgetUsage.currency_code,
        lastSync: projectBudgetUsage.current_time.value,
      };
      return projectUsage;
    });
  } catch (error) {
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
    throw new Error(`Error processing job for syncing budget usage`);
  }
}

/**
 * Fetches new budgets from the billing account and syncs them with BigQuery.
 *
 * @throws Will throw an error if there is an issue fetching or syncing the budgets.
 */
export async function fetchAndSyncNewBudgets() {
  try {
    const [budgets] = await budgetClient.listBudgets({
      parent: config.billing.accountId,
    });

    const dataset = bigqueryClient.dataset(config.bigquery.budgets.dataset);
    const table = dataset.table(config.bigquery.budgets.tables.budget.name);

    for (const budget of budgets) {
      const [queryResult] = await table.query({
        query: checkBudgetExistsQuery,
        params: {
          Id: budget.name,
        },
      });
      if (queryResult?.length === 0) {
        table.insert(
          [
            {
              name: budget.name,
              projectId: budget.displayName,
              amount: budget.amount?.specifiedAmount?.units
                ? parseFloat(String(budget.amount.specifiedAmount.units))
                : 0,
              currencyCode: budget.amount?.specifiedAmount?.currencyCode,
            },
          ],
          err => {
            if (err) {
              console.error(
                'error registering new project' + budget.displayName,
              );
            }
          },
        );
      }
    }
  } catch (error) {
    throw new Error(`Error syncing budget`);
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
    const dataset = bigqueryClient.dataset(
      config.bigquery.budgetExports.dataset,
    );
    const table = dataset.table(
      config.bigquery.budgetExports.tables.exported.name,
    );
    const [queryResult] = await table.query({
      query: fetchBudgetAllUsageQuery,
      params: {},
    });

    return queryResult.map((projectBudgetUsage: any) => {
      const projectUsage: Usage = {
        projectId: projectBudgetUsage.projectId,
        totalCost: projectBudgetUsage.totalCost,
        budgetLimit: projectBudgetUsage.budgetLimit,
        budgetConsumed: projectBudgetUsage.budgetConsumed,
        currencyCode: projectBudgetUsage.currencyCode,
        lastSync: projectBudgetUsage.lastSync,
      };
      return projectUsage;
    });
  } catch (error) {
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
    const dataset = bigqueryClient.dataset(
      config.bigquery.budgetExports.dataset,
    );
    const table = dataset.table(
      config.bigquery.budgetExports.tables.exported.name,
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

    const firstUsage: Usage = queryResult.map((item: any) => ({
      projectId: item.projectId,
      totalCost: item.totalCost,
      budgetLimit: item.budgetLimit,
      budgetConsumed: item.budgetConsumed,
      currencyCode: item.currencyCode,
      lastSync: item.lastSync,
    }))[0];

    return firstUsage;
  } catch (error) {
    throw new Error(`Error fetching budget usage for project: ${projectId}`, {
      cause: 500,
    });
  }
}
