# Data Science Portal

This repository provides a reference implementation for a self-service portal to deploy and manage GCP projects and infrastructure.

## Table of Contents

- [Developer Guide](#developer-guide)
  <!-- - [Overview](#overview) -->
  - [Setup](#setup)
    - [Bootstrap the Cluster](#bootstrap-the-cluster)
  - ...
- [Technical Design](#technical-design)
  - [Authentication in Backstage](#authentication-in-backstage)
  - [Integrations](#integrations)
    - [GitHub](#github)
  - ...

## Developer Guide

<!-- ### Overview -->

### Setup

#### Bootstrap the Cluster

Before we can use Backstage or the infrastructure templates we need a cluster deployed with Config Sync for GitOps, Crossplane for the control plane, and additional infrastructure to build and run Backstage. This is only required the first time a cluster starts up.

The process to bootstrap the cluster is documented in **[bootstrap/README.md](bootstrap/README.md)**.

## Technical Design

### Authentication in Backstage

To review the [Backstage documentation](https://backstage.io/docs/auth/):

> The authentication system in Backstage serves two distinct purposes: sign-in and identification of users, as well as delegating access to third-party resources.

The built-in [Google Authentication Provider](https://backstage.io/docs/auth/google/provider) is used to sign-in using Google OAuth.

The user's sign-in identity is matched to the corresponding User in the Backstage Catalog using the `emailMatchingUserEntityProfileEmail` [resolver](https://backstage.io/docs/auth/identity-resolver). The Backstage Catalog should be populated using an external source of truth. The ideal solution would be to load Users using an LDAP integration. Unfortunately we were not able to use Google Secure LDAP during the engagement. As a workaround, Users are manually managed in the [sci-portal-users](https://github.com/PHACDataHub/sci-portal-users) repo. The Backstage Catalog is populated using the [GitHub Discovery](https://backstage.io/docs/integrations/github/discovery) integration.

### Integrations

#### GitHub

We use a GitHub integration to:

* Create PRs from a template

Backstage can be configured to use [GitHub Apps](https://backstage.io/docs/integrations/github/github-apps) for backend authentication.

<!------------------------------------------>

## Installation

This project is a monorepo comprising multiple modules, each with its own set of prerequisites for installation. Please refer to the specific installation instructions for each modules below.

### Prerequisites

Before proceeding with installation, ensure you have the following tools installed:

- [Taskfile](https://taskfile.dev): A task runner for your project.
- Node.js v20: JavaScript runtime for executing applications.
- Yarn: Package manager for Node.js projects.

#### Taskfile

Install Taskfile globally using Yarn:

```bash
yarn global add @go-task/cli
```

For alternative installation methods, please refer to the [Taskfile documentation](https://taskfile.dev/installation/).

To list available tasks, run:

```bash
task --list
```

#### Node.js

Install Node.js using [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager):

```bash
nvm use
```

Verify the installation by checking the Node.js version:

```bash
node -v
```

#### Yarn v1 (Classic)

Backstage uses Yarn v1. It can be installed globally using corepack:

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
```

or installed globally:

```
npm install --global yarn@1.22.22
```

Verify the installation by checking the Yarn version:

```bash
yarn -v
```

With these prerequisites installed, you're ready to proceed with the installation of individual services within the monorepo.

## Modules

- [backstage](./backstage/README.md): Module for managing infrastructure tooling, services, and documentation
- [bootstrap](./bootstrap/README.md): Module for bootstrapping Google Kubernetes Engine (GKE) cluster
- [root-sync](./bootstrap/README.md): Module for Config Sync to manage root-level resources in Google Kubernetes Engine (GKE) cluster
- [budget-alerts](./budget-alerts/README.md): Module for managing Google Cloud Budget alerts