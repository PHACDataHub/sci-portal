import { errorHandler } from '@backstage/backend-common';
import { LoggerService } from '@backstage/backend-plugin-api';
import express from 'express';
import Router from 'express-promise-router';
import {
  fetchBudgetUsage,
  fetchBudgetsUsages,
  fetchSyncedBudgetUsage,
  syncBudgets,
  syncBudgetsUsages,
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
      await syncBudgets();
      const budgetUsages = await fetchBudgetsUsages(new Date());
      await syncBudgetsUsages(budgetUsages);
      response.json(budgetUsages);
    } catch (error) {
      response.status(500).json({
        message: 'Failed to sync budgets',
      });
    }
  });

  router.get('/usages', async (_, response) => {
    try {
      const usage = await fetchSyncedBudgetUsage();
      response.json(usage);
    } catch (error) {
      response.status(500).json({
        message: 'Failed to fetch synced budget usage',
      });
    }
  });

  router.get('/usages/:id', async (req, response) => {
    try {
      const projectId = req.params.id;
      const usage = await fetchBudgetUsage(projectId);
      if (usage.length === 0) {
        response.json([]);
        return;
      }
      response.json(usage[0]);
    } catch (error) {
      response.status(500).json({
        message: 'Failed to fetch budget usage',
      });
    }
  });

  router.use(errorHandler());
  return router;
}
