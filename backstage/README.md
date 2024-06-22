# [Backstage](https://backstage.io)

To start the app, run:

```sh
yarn install
yarn dev
```

## Specification

### Authentication in Backstage

To review the [Backstage documentation](https://backstage.io/docs/auth/):

> The authentication system in Backstage serves two distinct purposes: sign-in and identification of users, as well as delegating access to third-party resources.

The built-in [Google Authentication Provider](https://backstage.io/docs/auth/google/provider) is used to sign-in using Google OAuth. The user's sign-in identity is matched to the corresponding `User` in the Backstage Catalog using the `emailMatchingUserEntityProfileEmail` [resolver](https://backstage.io/docs/auth/identity-resolver).

> [!IMPORTANT]
> Users must be added to the Backstage Catalog before they can log in. This is a known limitation documented in [User Management](../docs/extensibility.md#user-management).
