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

* Using the [Google Authentication Provider](https://backstage.io/docs/auth/google/provider) which uses OAuth Credentials.
* The [Sign-in Identities and Resolvers](https://backstage.io/docs/auth/identity-resolver) docs state that we must explicitly configure the provider to map external identities to user identities in Backstage. This is **not** provided by the Google Authentication provider.
* Options:
  * A custom sign-in resolver with domain validation that populates `User` entities in the Catalog
  * Use the Google Secure LDAP service to get [LDAP Organizational Data](https://backstage.io/docs/integrations/ldap/org/)


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
corepack prepare yarn@1.22.19 --activate
```

or installed globally:

```
npm install --global yarn@1.22.19
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
- [budget-alerts](./budget-alerts/README.md): Module for managing Google Cloud Budget alerts.