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
      } catch {
        // Do nothing
      }

      ctx.logger.info(`Finished executing git diff`);
    },
  });
};
