import { ActionContext } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';

export const createUser = ({
  namespace,
  name = '',
  email,
}: {
  namespace?: string;
  name?: string;
  email: string;
}): ActionContext<JsonObject>['user'] => ({
  entity: {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'User',
    metadata: {
      namespace,
      name,
    },
    spec: { profile: { email } },
  },
  ref: `user:${namespace || 'default'}/${name}`,
});
