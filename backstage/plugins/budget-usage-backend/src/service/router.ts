import { errorHandler } from '@backstage/backend-common';
import { LoggerService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import {
  fetchAndSyncNewBudgets,
  generateBudgetUsages,
  fetchSyncedBudgetUsage,
  saveBudgetUsages,
  fetchSyncedBudgetUsages,
} from '../bigquery';

export interface RouterOptions {
  logger: LoggerService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.post('/sync', async (_, response) => {
    try {
      console.log('Fetching and syncing budgets');
      await fetchAndSyncNewBudgets();
      console.log('Generating budget usages');
      const budgetUsages = await generateBudgetUsages(new Date());
      console.log('Saving budget usages');
      await saveBudgetUsages(budgetUsages);
      response.json({
        message: 'Synced budgets',
        budgetUsages,
      });
    } catch (error) {
      const responseError = error as Error;
      response.status(500).json({
        message: responseError.message,
      });
    }
  });

  router.get('/usages', async (_, response) => {
    try {
      const usage = await fetchSyncedBudgetUsages();
      response.json(usage);
    } catch (error) {
      const responseError = error as Error;
      response.status(500).json({
        message: responseError.message,
      });
    }
  });

  router.get('/usages/:id', async (req, response) => {
    const projectId = req.params.id;

    try {
      const usage = await fetchSyncedBudgetUsage(projectId);
      if (!usage) {
        response.status(404).json({
          message: `No budget usage found for project: ${projectId}`,
        });
        return;
      }
      response.json(usage);
    } catch (error) {
      const responseError = error as Error;
      response.status(500).json({
        message: responseError.message,
      });
    }
  });

  router.use(errorHandler());
  return router;
}
