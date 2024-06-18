# Extensibility Report

## Contents

- [About this Document](#about-this-document)
- [Extensibility](#extensibility)
  - [Add A New Template](#add-a-new-template)
  - [Deploy Combinations of Templates](#deploy-combinations-of-templates)
  - [Multi-Cloud Support](#multi-cloud-support)
  - [Translations](#translations)
  - [Improving GitHub Discovery](#improving-github-discovery)
- [Known Limitations](#known-limitations)
  - [Not Ready for Production](#not-ready-for-production)
  - [Vertex AI Deprecations](#vertex-ai-deprecations)
  - [FinOps Reporting](#finops-reporting)
  - [Deleting Components](#deleting-components)
  - [Development on Windows](#development-on-windows)
  - [Viewer Permissions](#viewer-permissions)
- [Preparing for Production](#preparing-for-production)
- [Changes to the Project Scope](#changes-to-the-project-scope)
  - [RStudio and RShiny Cloud Workstation](#rstudio-and-rshiny-cloud-workstation)
  - ["Parking" Over-Budget Projects](#parking-over-budget-projects)
  - [Administrator Roles/Permissions](#administrator-rolespermissions)

## About this Document

### Purpose

This report outlines how to extend the reference implementation, documents known limitations, highlights concerns for a production deployment, and suggests next steps to implement features that were removed from scope.

### Intended Audience

This document is intended for the development team. The reader is expected to be familiar with Backstage, including the Catalog model, Software Templates, and the Permissions framework. Additionally, the reader should have an understanding of Crossplane concepts, including Providers, Managed Resources, Compositions, CompositeResourceDefinitions, Claims, and Usages.

### Background

PHAC engaged Google to build a reference implementation of a web app that provides self-service capabilities for users to provision infrastructure in Google Cloud. The contract specified the use of a GitOps approach initiated from Backstage templates, with changes reconciled using Config Sync. The infrastructure is defined using a combination of Crossplane, Config Connector, and Terraform.

The reference implementation is split between two repositories:

- [PHACDataHub/sci-portal-users](https://github.com/PHACDataHub/sci-portal-users) contains the `User`, `Group`, and infrastructure definitions.
- [PHACDataHub/sci-portal](https://github.com/PHACDataHub/sci-portal) contains the rest of the reference implementation.

## Extensibility

This section explains how to extend the reference implementation to add new templates, deploy combinations of templates, support multiple cloud providers, translations, and other concerns.

### Add A New Template

Before adding a new template, review the Backstage documentation on writing [Software Templates](https://backstage.io/docs/features/software-templates/) and [Crossplane Concepts](https://docs.crossplane.io/latest/concepts/).

We have tried to establish a convention that makes adding new templates easy. Templates are defined in the **[backstage/templates/](https://github.com/PHACDataHub/sci-portal/tree/main/backstage/templates)** directory. This is a convention because Backstage is configured to populate the Catalog from files match the `backstage/templates/*/template.yaml` pattern.

The template directory should contain the following files:

| Path                                                                       | Description                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **template.yaml**                                                          | The YAML manifest that contains the `Template` entity.<br><br>Set the `name`, `title`, and `description` in the `metadata`.<br>Consider changing the `spec.type` to match the Entity that will be created.                                      |
| **pull-request-description.njk**                                           | A Nunjucks template for the Pull Request description. Templates can include other templates using [template inheritance](https://mozilla.github.io/nunjucks/templating.html#template-inheritance).                                              |
| **pull-request-changes/**                                                  | A directory containing Nunjucks templates. These files are added to the Pull Request in the **[DMIA-PHAC/SciencePlatform/](https://github.com/PHACDataHub/sci-portal-users/tree/main/DMIA-PHAC/SciencePlatform)&lt;project-id&gt;/** directory. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**catalog-info.yaml.njk**  | A Nunjucks template that declares the Backstage Catalog entities to add. This includes the `Resource`, `Component`, and `Group`s for the Editor and Viewer permissions.                                                                         |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**claim.yaml.njk**         | Declares the Crossplane `Claim` used to provision infrastructure.                                                                                                                                                                               |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**kustomization.yaml.njk** | Configures Config Sync to ignore the non-Kubernetes resources such as the Backstage resources in **catalog-info.yaml**.                                                                                                                         |

Write Nunjucks templates with confidence using tests. Add unit tests to **[backstage/packages/backend/src/plugins/scaffolder/templates/](https://github.com/PHACDataHub/sci-portal/tree/main/backstage/packages/backend/src/plugins/scaffolder/templates)** that assert the Pull Request description and contents match our expectations.

Changes may be required to validate or modify the input parameters. This is handled in our custom action declared in **[backstage/packages/backend/src/plugins/scaffolder/actions/provisioner.ts](https://github.com/PHACDataHub/sci-portal/blob/main/backstage/packages/backend/src/plugins/scaffolder/actions/provisioner.test.ts)**.

The Pull Request creates a Crossplane `Claim` to provision new infrastructure. The corresponding `CompositeResourceDefinition` and `Composition` are declared in **[root-sync/base/crossplane/](https://github.com/PHACDataHub/sci-portal/tree/main/root-sync/base/crossplane)**. Be mindful to update the Kustomization Files to configure Config Sync to reconcile the manifests.

Define infrastructure using Crossplane following these principles:

- Define infrastructure exclusively using [Config Connector resources](https://cloud.google.com/config-connector/docs/reference/overview), when possible.  
  The [`config-connector` CLI tool](https://cloud.google.com/config-connector/docs/how-to/import-export/overview) may be helpful to export resources.
- When infrastructure cannot be defined using exclusively Config Connector resources, use Terraform.
- Do not mix tools (Config Connector, Terraform, or others).
- Isolate the Terraform state for each GCP Project (or equivalent). Create a `ProviderConfig` that configures the state file `backend` for each Project. Configure the `Workspace` to use the `ProviderConfig` using the `providerConfigRef`.
- Use [Crossplane Usages](https://docs.crossplane.io/latest/concepts/usages/) to ensure resources are deleted in the expected order.
- If the Crossplane Composition requires conditional statements, use [Composition Functions](https://docs.crossplane.io/latest/concepts/composition-functions/). It is a known limitation that [Patch and Transforms](https://docs.crossplane.io/latest/concepts/patch-and-transform/) do not support conditions.

If Terraform modules need to be modified, copy them to the [**templates/**](https://github.com/PHACDataHub/sci-portal/tree/main/templates) directory. The RAD Lab Data Science and Gen AI modules have been copied and modified there.

Define infrastructure with confidence using tests. There are corresponding [`chainsaw`](https://kyverno.github.io/chainsaw/latest/quick-start/run-tests/) tests in the **[tests/templates/](https://github.com/PHACDataHub/sci-portal/tree/main/tests/templates)** directory that can be used to apply manifests and assert the expected cluster resources are provisioned.

### Deploy Combinations of Templates

We recommend a few changes to deploy multiple templates into one GCP Project:

- Update the templates to prompt the user if they want to create or modify a GCP Project.
- Consider using the the [`OwnedEntityPicker`](https://backstage.io/docs/reference/plugin-scaffolder.ownedentitypickerfieldextension/) UI field to find Projects.
- Update the `data-science-portal:template:get-context` custom action to use an existing project ID.
- Ensure the Crossplane resources will not conflict when more than one template is applied to the same project.

### Multi-Cloud Support

Backstage and Crossplane can be configured to support additional cloud providers.

The following changes are necessary to support multi-cloud in our Backstage code:

- Update the [budget-usage-backend](https://github.com/PHACDataHub/sci-portal/tree/main/backstage/plugins/budget-usage-backend) to support other providers.
- Modify the templates to choose a cloud provider.
- Update the template actions to create a Pull Request that targets a specific cloud provider.

The following changes are necessary to support multi-cloud in our Crossplane Compositions:

- Add a label to indicate the provider in the `Composition`:

  ```yaml
  kind: Composition
  metadata:
    name: google-<template>
    labels:
      provider: google
  ```

- Modify the `Claim` to select the provider using `compositionSelector.matchLabels`:

  ```yaml
  kind: <template>Claim
  # ...
  spec:
    compositionSelector:
      matchLabels:
        provider: google
  ```

- (Optional) Set a default provider in the `CompositeResourceDefinition` using `defaultCompositionRef`:
  ```yaml
  kind: CompositeResourceDefinition
  # ...
  spec:
    defaultCompositionRef:
      name: google-<template>
  ```

Additional work is expected to set up a GitOps tool to provision infrastructure for the new provider, and add budget monitoring and alerts.

### Translations

Translations must be provided to the three distinct sources:

- The Frontend App can use a [Translation Extension](https://backstage.io/docs/frontend-system/building-apps/migrating/#__experimentaltranslations).
- The Plugins have [experimental support](https://backstage.io/docs/plugins/internationalization/).
- Templates do not have support but the underlying library `react-jsonschema-form` provides a [`translateString` function](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/form-props/#translatestring) that may work.

### Improving GitHub Discovery

Backstage has been configured to discover new Catalog entities from our repositories using polling. This pull-based model is inefficient and can be improved on by [following the documentation](https://backstage.io/docs/integrations/github/discovery/#events-supportEvents) to configure Backstage to listen for events from a GitHub Webhook.

## Known Limitations

### Not Ready for Production

This is a reference implementation of Backstage not intended for deployment in production. An incomplete list of considerations to deploy in production are [documented below](#preparing-for-production).

### Vertex AI Deprecations

The RAD Lab Data Science and Gen AI modules will not be able to create notebooks after January 30, 2025 when [support for Vertex AI Workbench managed notebooks is shutdown](https://cloud.google.com/vertex-ai/docs/deprecations). Existing managed notebooks will continue to work but will not be patched.

As of June 2024, the team supporting the [RAD Lab modules](https://github.com/GoogleCloudPlatform/rad-lab/tree/main/modules) is aware of this issue but has not scheduled maintenance. The RAD Lab Terraform modules must be updated to migrate managed notebook instances to Vertex AI Workbench instances.

### FinOps Reporting

To ensure timely delivery of an extensible [Cost Dashboard](https://backstage.alpha.phac-aspc.gc.ca/cost-dashboard), a Looker Studio report has been embedded instead a custom developed dashboard. This provides a flexible starting point that allows more of the team to help refine and build a meaningful FinOps report.

### Deleting Components

To follow the GitOps methodology we should delete Components from the Backstage UI and create a Pull Request in GitHub. However, Backstage cannot create a GitHub Pull Request that removes files, blocking us from implementing this feature. This limitation is tracked on GitHub by [backstage/backstage#23447](https://github.com/backstage/backstage/issues/23447).

To implement this feature, we could add a [Custom Catalog Action](https://backstage.io/docs/features/software-catalog/catalog-customization/#customize-actions) that would use a Software Template to remove a project. The new Software Template would take the Catalog Entity and a justification as inputs. When submitted, the template would need to perform the following actions:

- Fetch the **[DMIA-PHAC](https://github.com/PHACDataHub/sci-portal/tree/main/DMIA-PHAC)** directory
- Remove the directory from the [Kustomization File](https://github.com/PHACDataHub/sci-portal-users/blob/main/DMIA-PHAC/kustomization.yaml)
- Remove the project directory
- Create a Pull Request

We already modify the Kustomization File in **[backstage/packages/backend/.../kustomization-file.ts](https://github.com/PHACDataHub/sci-portal/blob/main/backstage/packages/backend/src/plugins/scaffolder/actions/kustomization-file.ts)**. Add a new custom action to remove a directory/resource.

If [backstage/backstage#23447](https://github.com/backstage/backstage/issues/23447) is resolved, update Backstage and use the new API to removes files. Otherwise, create a custom action that extends the built-in `publish:github:pull-request` action to accept a new input parameter for files to delete, and call the `octokit.createPullRequest` method directly.

### Development on Windows

We discovered that the Backstage Software Templates fail to render templates on Windows. We have created two issues to track this limitation on GitHub: [PHACDataHub/sci-portal#309](https://github.com/PHACDataHub/sci-portal/issues/309) and [backstage/backstage#25056](https://github.com/backstage/backstage/issues/25056). We skip the failing unit tests on Windows to prevent this problem from affecting development.

### Viewer Permissions

In order to focus on higher priority UI features, the Viewers do not have additional permissions defined in Backstage or in the Templates. This is tracked by [PHACDataHub/sci-portal#464](https://github.com/PHACDataHub/sci-portal/issues/464).

## Preparing for Production

This is a reference implementation that is not ready for production. We've listed a few areas for concern below but there are certainly more things to consider:

- Deploy in a hardened cluster
- Improve secrets management
- Harden the GitHub App integration
- Harden the Backstage Backend auth
- Validate and sanitize all inputs
- Refine the dataset used for the Cost Dashboard
- Monitor security vulnerabilities

## Changes to the Project Scope

A number of factors contributed to changes in scope including the required LDAP integration being unavailable, delays in accessing an email service, and a request to prioritize development in Backstage over infrastructure templates. This section documents how to continue working on the deprioritized features.

### RStudio and RShiny Cloud Workstation

Work on Collin Brown’s [template](https://github.com/PHACDataHub/infra-core/tree/cloud-workstation-template/cloud-workstation-template) was paused to prioritize other UI features. At the time work was stopped, we needed a decision if the container image can be built and owned as part of the Data Science Portal. The remainder of the implementation can follow the documentation to [Add A New Template](#add-a-new-template).

### "Parking" Over-Budget Projects

It is possible to "park" or shutdown an over-spending project to reduce costs on a case-by-case basis.

If the infrastructure for a given template can be configured to reduce spending, we can create a Crossplane Composition for the "parked" state and use the `compositionSelector` like the implementation for [multi-cloud support](#multi-cloud-support).

This functionality can be added to the Backstage UI by introducing a [Custom Catalog Action](https://backstage.io/docs/features/software-catalog/catalog-customization#customize-actions) that appears as a button on the Catalog entity. The button would link to a Template that creates a Pull Request with the new "parked" state. Configure the button to be visible only to users with the [required permissions](https://backstage.io/docs/permissions/frontend-integration).

Creating a Pull Request to "park" over-budget projects can be automated as well. Configure the Cloud Function that handles budget alert notifications to use the Backstage API to create a Pull Request at a given threshold.

A similar approach can be taken to restore a “parked” projects.

### Administrator Roles/Permissions

By default, Backstage ships with no access controls. It is up to the development team to declare the rules that control how users interact with Backstage using the [Permissions framework](https://backstage.io/docs/permissions/overview). We recommend reviewing the [Permission Concepts](https://backstage.io/docs/permissions/concepts) documentation to get started.

We have written a permission policy in **[backstage/packages/backend/src/plugins/permissions/](https://github.com/PHACDataHub/sci-portal/tree/report/backstage/packages/backend/src/plugins/permissions)** that declares the following rules:

- Users can only see the Components and Resources they own in the Catalog.
- Members of the Platform Team can view all resources.
- Members of the Platform Team can use the template debugging tools.

Follow [the documentation](https://backstage.io/docs/permissions/overview/) to define additional rules to control access to routes, UI features, backend features, backend APIs, and more.

### Additional Templates for RAD Lab and GCP Services

Follow the documentation above to [Add A New Template](#add-a-new-template).
