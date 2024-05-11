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
      console.log(emptyDir);
      try {
        await executeShellCommand({
          command: 'git',
          args: ['diff', '--no-index', emptyDir, '.'],
          logStream: ctx.logStream,
          options: {
            cwd: ctx.workspacePath,
          },
        });
      } catch {}

      ctx.logger.info(`Finished executing git diff`);
    },
  });
};
