import { ActionContext } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';

export const createUser = ({
  name = '',
  email,
}: {
  name?: string;
  email: string;
}): ActionContext<JsonObject>['user'] => ({
  entity: {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'User',
    metadata: { name },
    spec: { profile: { email } },
  },
});
