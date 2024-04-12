# PHAC Data Science Portal Monorepo

Welcome to our monorepo housing various services including Backstage, Kubernetes manifests, and more.

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

#### Yarn (Corepack)

Install Yarn globally using npm (Node Package Manager):

```bash
corepack enable
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
