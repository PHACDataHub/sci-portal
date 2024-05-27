import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { NotFoundError } from '@backstage/errors';
import { googleAuthenticator } from '@backstage/plugin-auth-backend-module-google-provider';
import {
  authProvidersExtensionPoint,
  createOAuthProviderFactory,
} from '@backstage/plugin-auth-node';

export const googleAuthWithCustomSignInResolver = createBackendModule({
  pluginId: 'auth',
  moduleId: 'development-google-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        providers: authProvidersExtensionPoint,
      },
      async init({ config, providers }) {
        providers.registerProvider({
          providerId: 'google',
          factory: createOAuthProviderFactory({
            authenticator: googleAuthenticator,
            async signInResolver({ profile }, ctx) {
              if (!profile.email) {
                throw new Error(
                  'Login failed, user profile does not contain an email',
                );
              }

              // Verify the domain
              const [name, domain] = profile.email.split('@');
              const expectedDomains: string[] = config
                .getString('auth.allowedDomains')
                .split(',');
              if (!expectedDomains.includes(domain)) {
                throw new Error(
                  `Login failed, '${profile.email}' does not belong to an expected domain`,
                );
              }

              // Sign in with the user from the Catalog if possible
              const entityFilterQuery = {
                filter: [{ kind: 'User', 'spec.profile.email': profile.email }],
              };
              try {
                const { entity } = await ctx.findCatalogUser(entityFilterQuery);
                if (entity) {
                  return ctx.signInWithCatalogUser(entityFilterQuery);
                }
              } catch (err) {
                if (!(err instanceof NotFoundError)) {
                  throw err;
                }
              }

              // By using `stringifyEntityRef` we ensure that the reference is formatted correctly
              const userEntity = stringifyEntityRef({
                kind: 'User',
                namespace: domain,
                name,
              });
              return ctx.issueToken({
                claims: {
                  sub: userEntity,
                  ent: [userEntity],
                },
              });
            },
          }),
        });
      },
    });
  },
});
