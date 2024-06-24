# Data Science Portal

This repository contains a reference implementation of a web app that provides self-service capabilities for users to provision infrastructure in Google Cloud. The contract specified the use of a GitOps approach initiated from Backstage templates, with changes reconciled using Config Sync. The infrastructure is defined using a combination of Crossplane, Config Connector, and Terraform.

The reference implementation is split between two repositories:

- [PHACDataHub/sci-portal-users](https://github.com/PHACDataHub/sci-portal-users) contains the `User`, `Group`, and infrastructure definitions.
- [PHACDataHub/sci-portal](https://github.com/PHACDataHub/sci-portal) contains the rest of the reference implementation.

## Contents

<!-- vscode-markdown-toc -->

- [Contents](#Contents)
- [Features](#Features)
  - [Authentication](#Authentication)
  - [User Self-Service](#UserSelf-Service)
  - [GitOps Approach](#GitOpsApproach)
  - [Deployment Status](#DeploymentStatus)
  - [Deployment Isolation](#DeploymentIsolation)
  - [Cost Visibility](#CostVisibility)
  - [Budget Management](#BudgetManagement)
  - [Budget Reporting](#BudgetReporting)
  - [Extensibility](#Extensibility)
- [Contributing](#Contributing)
  - [Directories](#Directories)
  - [Environments](#Environments)
  - [Initial Setup (Bootstrapping)](#InitialSetupBootstrapping)
  - [Prerequisites](#Prerequisites)
  - [Guidelines](#Guidelines)
  - [Keeping Tools Updated](#KeepingToolsUpdated)
  - [Troubleshooting](#Troubleshooting)

<!-- vscode-markdown-toc-config
	numbering=false
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->

## Features

### Authentication

Users sign in using PHAC's designed Google authentication methods.

> [!IMPORTANT]
> Users must be added to the Backstage Catalog before they can log in. This is a known limitation documented in [User Management](./docs/extensibility.md#user-management).

### User Self-Service

Users can visualize the available templates on the [Create...](https://backstage.alpha.phac-aspc.gc.ca/create) page. The templated deployments are prompt the user for their team, administrative details, and cloud resource configuration.

To provision a resource, select a template, fill out the required information, and submit the form. The user is provided with a link to view the Pull Request that is created.

### GitOps Approach

In a GitOps approach the repository serves as the source of truth. After bootstrapping the cluster to start Config Sync, we use GitOps to define the desired state of the cluster. Config Sync reconciles the current state in the cluster and the desired state in the repositories.

When a user creates a templated deployment from Backstage it creates a Pull Request in the [PHACDataHub/sci-portal-users](https://github.com/PHACDataHub/sci-portal-users) repository.

### Deployment Status

When the Pull Request is merged, each templated deployment instance will appear in the Backstage Catalog and can provide helpful links. For example, the RAD Lab Data Science templates how a link to the Managed Notebooks in the Vertex AI Workbench.

Monitoring the current deployment status was not a prioritized feature. The next steps for development are documented in the [Extensibility Report](./docs/extensibility.md#deployment-status).

### Deployment Isolation

The templated deployments provision resources in a new isolated GCP project in alignment with the agency’s micro-segmentation security architecture.

### Cost Visibility

Users can see the project **Cost** and **% Budget** in the [Backstage Catalog](https://backstage.alpha.phac-aspc.gc.ca/catalog). These values are updated daily.

### Budget Management

Each project is actively monitored for consumption. Budget alert emails are sent when the budget reaches 25%, 50%, 75%, 90%, 95%, and 100%. Over-budget alert emails are sent for each percent between 100% and 120%.

### Budget Reporting

A Looker Studio dashboard has been embedded on the [Cost Dashboard](https://backstage.alpha.phac-aspc.gc.ca/cost-dashboard) page. This offers a flexible starting point that the team can refine to build a meaningful FinOps reports that meets their needs. Each project is labeled with the cost centre and display name to support reporting grouped by cost centre.

The billing data is exported daily to BigQuery for additional analysis.

### Extensibility

The overall solution is extensible. It supports adding Software Templates, displaying custom information and links in the Catalog, adding custom actions to the Catalog, extending the permissions model, and much more. This is documented in the [Extensibility Report](./docs/extensibility.md).

## Contributing

### Directories

This repository contains the following directories:

| Directory         | Description                                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **.devbox**       | This directory contains the [Devbox](https://www.jetify.com/devbox/docs/) configuration to install [`gcloud`](https://cloud.google.com/sdk/gcloud) in an isolated shell for development. |
| **backstage**     | This directory contains Backstage, including custom plugins and template definitions.                                                                                                    |
| **bootstrap**     | This directory contains the scripts and infrastructure definitions to deploy Google Kubernetes Engine (GKE), Crossplane, and the Crossplane providers.                                   |
| **budget-alerts** | This directory contains a Cloud Function that sends budget alert emails with GC Notify.                                                                                                  |
| **root-sync**     | This directory contains Kubernetes manifests and Kustomizations reconciled by Config Sync.                                                                                               |
| **taskfiles**     | This directory contains Task definitions used by [Task](https://taskfile.dev/).                                                                                                          |
| **templates**     | This directory contains Terraform modules managed and modified by the Data Science Portal team.                                                                                          |
| **tests**         | This directory contains [`chainsaw`](https://kyverno.github.io/chainsaw/latest/) tests that verify the Crossplane Compositions create the expected Kubernetes resources.                 |

### Environments

At this time there is only one non-production environment. The reference implementation is not intended for production. Some concerns for moving to production have been documented in the [Extensibility Report](./docs/extensibility.md#preparing-for-production).

We encourage creating at least one more non-production environment to develop and maintain the system with confidence.

### Initial Setup (Bootstrapping)

The cluster must be deployed with Config Sync for GitOps, Crossplane for the control plane, and additional infrastructure before we can build and run Backstage. This is only required the first time the cluster starts. The process is documented in **[bootstrap/README.md](bootstrap/README.md)**.

### Prerequisites

#### Taskfile

Install `task` following [the documentation](https://taskfile.dev/installation/). To install globally using Yarn run:

```bash
yarn global add @go-task/cli
```

To verify the installation and list available tasks run:

```bash
task --list
```

#### Node.js

This project uses more than one version of Node.js (v18 and v20). We recommend using a tool that manages multiple versions of Node.js like [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) or [NVM for Windows](https://github.com/coreybutler/nvm-windows).

To use the version of Node.js defined in the [`.nvmrc`](https://github.com/nvm-sh/nvm?tab=readme-ov-file#nvmrc) file run:

```bash
nvm use
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

### Guidelines

#### Regions

Deploy GCP infrastructure in Canadian regions. Use `northamerica-northeast1` (Montreal) or `northamerica-northeast2` (Toronto).

#### Crossplane Providers

Follow these principles to define infrastructure using Config Connector or Terraform as managed resources in your Crossplane compositions:

- Define infrastructure exclusively using [Config Connector resources](https://cloud.google.com/config-connector/docs/reference/overview), when possible.  
  The [`config-connector` CLI tool](https://cloud.google.com/config-connector/docs/how-to/import-export/overview) may be helpful to export resources.
- When infrastructure cannot be defined using exclusively Config Connector resources, use Terraform.
- Do not mix tools (Config Connector, Terraform, or others).
- Isolate the Terraform state for each GCP Project (or equivalent). Create a `ProviderConfig` that configures the state file [`backend`](https://developer.hashicorp.com/terraform/language/settings/backends/configuration#using-a-backend-block) for each Project. Configure the `Workspace` to use the `ProviderConfig` using the `providerConfigRef`.
- Use [Crossplane Usages](https://docs.crossplane.io/latest/concepts/usages/) to ensure resources are deleted in the expected order.
- If the Crossplane Composition requires conditional statements, use [Composition Functions](https://docs.crossplane.io/latest/concepts/composition-functions/). It is a known limitation that [Patch and Transforms](https://docs.crossplane.io/latest/concepts/patch-and-transform/) do not support conditions.

If Terraform modules need to be modified, copy them to the [**templates/**](https://github.com/PHACDataHub/sci-portal/tree/main/templates) directory. The RAD Lab Data Science and Gen AI modules have been copied and modified there.

#### Versioning

We recommend the following approach to modifying `CompositeResourceDefinitions` and `Compositions` that are used in production:

- When making a breaking change to a `CompositeResourceDefinition`, follow [the Crossplane documentation](https://docs.crossplane.io/latest/concepts/composite-resource-definitions/#xrd-versions) to create a new `version`.
- When making a breaking change to a `Composition`, follow [the Crossplane documentation](https://docs.crossplane.io/latest/concepts/composition-revisions/#default-update-policy) to use Composition Revisions with a manual update policy.

This approach enables the team to test changes to manifests with confidence, the progressively roll out and upgrade the remaining resources.

#### Test The Infrastructure

Define infrastructure with confidence using tests. There are corresponding [`chainsaw`](https://kyverno.github.io/chainsaw/latest/quick-start/run-tests/) tests in the **[tests/templates/](https://github.com/PHACDataHub/sci-portal/tree/main/tests/templates)** directory that can be used to apply manifests and assert the expected cluster resources are provisioned.

### Keeping Tools Updated

#### Backstage

Follow [the documentation](https://backstage.io/docs/getting-started/keeping-backstage-updated/#updating-backstage-versions-with-backstage-cli) to use the `backstage-cli` to update Backstage.

The Backstage installation was created from a template, then modified. To keep up to date with changes to the template follow [the documentation](https://backstage.io/docs/getting-started/keeping-backstage-updated/#following-create-app-template-changes) and use the [Backstage Upgrade Helper](https://backstage.github.io/upgrade-helper/).

#### Config Sync

Review the [Release Notes](https://cloud.google.com/kubernetes-engine/enterprise/config-sync/docs/release-notes) and [documentation](https://cloud.google.com/kubernetes-engine/enterprise/config-sync/docs/how-to/upgrade-config-sync) to upgarde Config Sync.

#### Crossplane

Review the release notes on [docs.crossplane.io](https://docs.crossplane.io/latest/release-notes/) or [GitHub](https://github.com/crossplane/crossplane/releases), and follow the [documentation](https://docs.crossplane.io/v1.16/software/upgrade/) to upgrade Crossplane.

#### Crossplane Provider for Kubernetes

Review the [release notes](https://github.com/crossplane-contrib/provider-kubernetes/releases) and [README](https://github.com/crossplane-contrib/provider-kubernetes?tab=readme-ov-file#install) to manually upgrade `provider-kubernetes` in [**root-sync/base/crossplane/project/kubernetes.yaml**](./root-sync/base/crossplane/project/kubernetes.yaml).

#### Crossplane Provider for Terraform

Review the [release notes](https://github.com/upbound/provider-terraform/releases) and [documentation](https://marketplace.upbound.io/providers/upbound/provider-terraform/v0.16.0/docs/quickstart) to manually upgrade `provider-terraform` in [**bootstrap/crossplane/templates/terrafrom/provider.yaml**](./bootstrap/crossplane/templates/terrafrom/provider.yaml).

> [!WARNING]  
> The RAD Lab Terraform modules require the `gcloud` CLI tool to be availble where `terraform` is run. We configure `provider-terraform` to use a custom runtime image defined in [**bootstrap/crossplane/templates/terrafrom/build**](./bootstrap/crossplane/templates/terrafrom/build).

Update `PROVIDER_TERRAFORM_VERSION` in the [**Dockerfile**](./bootstrap/crossplane/templates/terrafrom/build/Dockerfile).

#### `gcloud`

> [!WARNING]  
> The RAD Lab Terraform modules require the `gcloud` CLI tool to be availble where `terraform` is run. We configure `provider-terraform` to use a custom runtime image defined in [**bootstrap/crossplane/templates/terrafrom/build**](./bootstrap/crossplane/templates/terrafrom/build).

Review the [release notes](https://cloud.google.com/sdk/docs/release-notes) and update `CLOUD_SDK_VERSION` in the [**Dockerfile**](./bootstrap/crossplane/templates/terrafrom/build/Dockerfile).

#### Config Connector

Review the [release notes](https://cloud.google.com/config-connector/docs/release-notes) and [documentation](https://cloud.google.com/config-connector/docs/how-to/install-manually#upgrading) to upgrade Config Connector.

### Troubleshooting

#### Config Sync

If the Config Sync sync status appears stuck on [Google Console](https://console.cloud.google.com/kubernetes/config_management/packages?project=pht-01hsv4d2m0n) check the `root-reconciler` Pod logs in the `config-management-system` namespace.

#### Crossplane

These references will help troubleshoot Crossplane:

- [Why is my composition not working?](https://blog.crossplane.io/faq-1-composition-not-working/)
- [Troubleshoot Crossplane](https://docs.crossplane.io/latest/guides/troubleshoot-crossplane/)

#### Terraform Provider for Crossplane

To view the logs when the Terraform Provider runs `plan` and `apply`:

- Find the `metadata.UID` for the `Workspace` managed resource
- Open a shell on the `provider-terraform` Pod
- View the log stored by UID. For example:

  ```shell
  less /tf/b0709d67-7c59-4c6e-99b7-60dfb37e8f68/log_terraform.log
  ```

#### Kubernetes Provider for Crossplane

The `resources` in a Crossplane `Composition` must be **managed resources**. To create a Kubernetes resource, they must be wrapped in the `Object` managed resource. Crossplane will not create Kubernetes resources directly.
