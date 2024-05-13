/**
 * This custom action will show the contents of ctx.workspacePath as a unified diff.
 */
import {
  createTemplateAction,
  executeShellCommand,
} from '@backstage/plugin-scaffolder-node';

export const createDebugWorkspaceAction = () => {
  return createTemplateAction<{}>({
    id: 'debug:workspace',
    schema: {},
    async handler(ctx) {
      const emptyDir = await ctx.createTemporaryDirectory();
      try {
        await executeShellCommand({
          command: 'git',
          args: ['diff', '--no-index', emptyDir, '.'],
          logStream: ctx.logStream,
          options: {
            cwd: ctx.workspacePath,
          },
        });
      } catch (err) {
        ctx.logger.error('git diff failed', err);
      }

      ctx.logger.info(`Finished executing git diff`);
    },
  });
};
