import { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import {
  AuthorizeResult,
  PolicyDecision,
  isPermission,
} from '@backstage/plugin-permission-common';
import {
  PermissionPolicy,
  PolicyQuery,
} from '@backstage/plugin-permission-node';
import {
  createScaffolderTemplateConditionalDecision,
  scaffolderTemplateConditions,
} from '@backstage/plugin-scaffolder-backend/alpha';
import {
  templateParameterReadPermission,
  templateStepReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';

const isNotMemberOfPlatformTeam = (user?: BackstageIdentityResponse) =>
  !(
    user &&
    user.identity.ownershipEntityRefs.includes('group:default/platform-team')
  );

export class CustomPermissionPolicy implements PermissionPolicy {
  async handle(
    request: PolicyQuery,
    user?: BackstageIdentityResponse,
  ): Promise<PolicyDecision> {
    if (
      isNotMemberOfPlatformTeam(user) &&
      (isPermission(request.permission, templateParameterReadPermission) ||
        isPermission(request.permission, templateStepReadPermission))
    ) {
      return createScaffolderTemplateConditionalDecision(request.permission, {
        not: scaffolderTemplateConditions.hasTag({ tag: 'template-developer' }),
      });
    }

    return {
      result: AuthorizeResult.ALLOW,
    };
  }
}
