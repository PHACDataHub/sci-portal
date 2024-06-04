import {
  ActionContext,
  createTemplateAction,
} from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';
import * as fs from 'node:fs/promises';
import { dirname, join } from 'node:path';
import * as yaml from 'yaml';

/**
 * Reads the Kustomization file from the `path` or returns the default.
 */
const readFile = async (path: string): Promise<yaml.Document> => {
  let source: string;

  try {
    const buf = await fs.readFile(path);
    source = buf.toString();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }

    await fs.mkdir(dirname(path), { recursive: true });

    source = `
        apiVersion: kustomize.config.k8s.io/v1beta1
        kind: Kustomization
        resources: []
    `
      .slice(1) // Strip leading whitespace.
      .replace(/^ {8}/gm, '');
  }

  return yaml.parseDocument(source);
};

/**
 * Inserts the `resource` into the Kustomization file in alphabetical order.
 */
export const insertResource = async (
  ctx: ActionContext<{ path: string; resource: string }, JsonObject>,
): Promise<void> => {
  const path = join(ctx.workspacePath, ctx.input.path);
  const doc = await readFile(path);

  // Bail if there are errors parsing
  if (doc.errors.length) {
    ctx.logger.error(doc.errors);
    throw new Error(`A YAML parsing error occurred reading "${path}"`);
  }

  // Get the "resources" array, or default to an empty array
  let resources: yaml.YAMLSeq;
  if (doc.has('resources')) {
    const value = doc.get('resources');
    if (value === undefined) {
      resources = new yaml.YAMLSeq();
    } else {
      if (!yaml.isSeq(value)) {
        throw new TypeError(
          `The "resources" key is not a Sequence in "${path}"`,
        );
      }
      resources = value;
    }
  } else {
    resources = new yaml.YAMLSeq();
  }

  // Add the new resource
  resources.add(new yaml.Scalar(ctx.input.resource));

  // Sort when every item is a string
  if (
    resources.items.every(
      item => yaml.isScalar(item) && typeof item.value === 'string',
    )
  ) {
    (resources.items as yaml.Scalar<string>[]).sort((a, b) =>
      a.value.localeCompare(b.value),
    );
  }

  // Output the file
  doc.setIn(['resources'], resources);
  await fs.writeFile(
    path,
    doc.toString({
      collectionStyle: 'block',
      directives: true,
    }),
  );
  ctx.logger.info(
    `Added resource "${ctx.input.resource}" to "${ctx.input.path}"`,
  );
};

/**
 * Inserts the `resource` into the Kustomization file at `path`.
 */
export const createKustomizationAction = () => {
  return createTemplateAction<{ path: string; resource: string }>({
    id: 'data-science-portal:kustomization:add-resource',
    schema: {
      input: {
        required: ['path', 'resource'],
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to kustomization.yaml',
          },
          resource: {
            type: 'string',
            description: 'Directory to add to "resources"',
          },
        },
      },
    },
    async handler(ctx) {
      return insertResource(ctx);
    },
  });
};
