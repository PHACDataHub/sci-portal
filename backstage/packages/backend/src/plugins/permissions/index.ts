import { BackstageIdentityResponse } from '@backstage/plugin-auth-node';
import {
  catalogConditions,
  createCatalogConditionalDecision,
} from '@backstage/plugin-catalog-backend/alpha';
import {
  AuthorizeResult,
  PolicyDecision,
  isPermission,
  isResourcePermission,
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

    if (
      isNotMemberOfPlatformTeam(user) &&
      isResourcePermission(request.permission, 'catalog-entity')
    ) {
      return createCatalogConditionalDecision(request.permission, {
        anyOf: [
          {
            allOf: [
              catalogConditions.isEntityKind({
                kinds: ['Component', 'Resource'],
              }),
              catalogConditions.isEntityOwner({
                claims: user?.identity.ownershipEntityRefs ?? [],
              }),
            ],
          },
          {
            not: catalogConditions.isEntityKind({
              kinds: ['Component', 'Resource'],
            }),
          },
        ],
      });
    }

    return {
      result: AuthorizeResult.ALLOW,
    };
  }
}
