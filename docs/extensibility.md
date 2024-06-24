# Extensibility Report

## Contents

* [Contents](#contents)
* [About this Document](#about-this-document)
  + [Purpose](#purpose)
  + [Intended Audience](#intended-audience)
  + [Background](#background)
* [Extensibility](#extensibility)
  + [Add A New Template](#add-a-new-template)
  + [Deploy Combinations of Templates](#deploy-combinations-of-templates)
  + [Multi-Cloud Support](#multi-cloud-support)
  + [Translations](#translations)
  + [Improving GitHub Discovery](#improving-github-discovery)
  + [Populate Templates Using An Entity Provider](#populate-templates-using-an-entity-provider)
* [Known Limitations](#known-limitations)
  + [Not Ready for Production](#not-ready-for-production)
  + [User Management](#user-management)
  + [Vertex AI Deprecations](#vertex-ai-deprecations)
  + [FinOps Reporting](#finops-reporting)
  + [Deleting Components](#deleting-components)
  + [Development on Windows](#development-on-windows)
  + [Viewer Permissions](#viewer-permissions)
  + [Budget Alerts](#budget-alerts)
* [Changes to the Project Scope](#changes-to-the-project-scope)
  + [RStudio and RShiny Cloud Workstation](#rstudio-and-rshiny-cloud-workstation)
  + ["Parking" Over-Budget Projects](#parking-over-budget-projects)
  + [Administrator Roles/Permissions](#administrator-rolespermissions)
  + [Additional Templates for RAD Lab and GCP Services](#additional-templates-for-rad-lab-and-gcp-services)
  + [Deployment Status](#deployment-status)
  + [Security Vulnerabilities](#security-vulnerabilities)
* [Preparing for Production](#preparing-for-production)

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

Follow the guidelines in the [README](../README.md#guidelines) to define infrastructure using Crossplane.

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

Additional work is expected to set up a GitOps tool to provision infrastructure using the new provider, and add budget monitoring and alerts.

### Translations

Translations must be defined for each Backstage components:

- The App (Frontend) uses a [Translation Extension](https://backstage.io/docs/frontend-system/building-apps/migrating/#__experimentaltranslations).
- Plugins have [experimental support](https://backstage.io/docs/plugins/internationalization/).
- Templates do not have support but the underlying library `react-jsonschema-form` provides a [`translateString` function](https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/form-props/#translatestring) that may work.

### Improving GitHub Discovery

Backstage has been configured to discover new Catalog entities in our repositories using polling. The pull-based model is inefficient and does not scale well as the number of size of the repositories grows. [Following the documentation](https://backstage.io/docs/integrations/github/discovery/#events-supportEvents) to configure Backstage to listen for events from a GitHub Webhook to improve the performance.

### Populate Templates Using An Entity Provider

As the number of templates grows it may be desirable to populate templates using an [custom entity provider](https://backstage.io/docs/features/software-catalog/external-integrations) that reads the Crossplane `CompositeResourceDefinitions` defined in the cluster and transforms them into a `Template` entity. This should be possible since the `CompositeResourceDefinitions` declare the inputs using an OpenAPI schema. At the time of writing this is not available as an open source plug-in for Crossplane.

## Known Limitations

### Not Ready for Production

This is a reference implementation that is not intended for deployment in production. An incomplete list of considerations to deploy in production are [documented below](#preparing-for-production).

### User Management

As a principle, the Backstage Catalog should be populated from an external source of truth. The ideal solution for the reference implementation is populating `Users` using an LDAP integration. However, the Google Secure LDAP Service was unavailable. Without an LDAP integration, we must manually manage users in the [PHACDataHub/sci-portal-users](https://github.com/PHACDataHub/sci-portal-users) repository. Backstage is configured to populate `User`s from the repo using the [GitHub Discovery](https://backstage.io/docs/integrations/github/discovery) integration.

### Vertex AI Deprecations

The RAD Lab Data Science and Gen AI modules will not be able to create notebooks after January 30, 2025 when [support for Vertex AI Workbench managed notebooks is shutdown](https://cloud.google.com/vertex-ai/docs/deprecations). Existing managed notebooks will continue to work but will not be patched.

As of June 2024, the team supporting [RAD Lab](https://github.com/GoogleCloudPlatform/rad-lab/tree/main/modules) is aware of this issue but has not scheduled maintenance. The RAD Lab Terraform modules must be updated to migrate managed notebook instances to Vertex AI Workbench instances.

### FinOps Reporting

To ensure timely delivery of an extensible [Cost Dashboard](https://backstage.alpha.phac-aspc.gc.ca/cost-dashboard), a Looker Studio report has been embedded in Backstage instead a custom dashboard. This provides a flexible starting that the team can refine to build a meaningful FinOps report that meets their needs.

### Deleting Components

To follow the GitOps methodology we should delete Components from the Backstage UI and create a Pull Request in GitHub. However, Backstage cannot create a GitHub Pull Request that removes files, blocking us from implementing this feature. This limitation is tracked by the GitHub Issue [backstage/backstage#23447](https://github.com/backstage/backstage/issues/23447).

To implement this feature, add a [Custom Catalog Action](https://backstage.io/docs/features/software-catalog/catalog-customization/#customize-actions) that links to a Software Template that removes a project. The template would need to perform the following steps:

- Fetch the **[DMIA-PHAC](https://github.com/PHACDataHub/sci-portal/tree/main/DMIA-PHAC)** directory
- Remove the directory from the [Kustomization File](https://github.com/PHACDataHub/sci-portal-users/blob/main/DMIA-PHAC/kustomization.yaml)
- Remove the project directory
- Create a Pull Request

Extend the module that modifies the Kustomization File in **[backstage/packages/backend/src/plugins/scaffolder/actions/kustomization-file.ts](https://github.com/PHACDataHub/sci-portal/blob/main/backstage/packages/backend/src/plugins/scaffolder/actions/kustomization-file.ts)**.

If [the GitHub Issue](https://github.com/backstage/backstage/issues/23447) is resolved, update Backstage and use the new API to removes files. Otherwise, create a custom action that extends the built-in `publish:github:pull-request` action to accept a new input parameter for files to delete, and call the `octokit.createPullRequest` method directly.

### Development on Windows

We discovered that the Backstage Software Templates fail to render templates on Windows. We have created two GitHub Issues to track this limitation: [PHACDataHub/sci-portal#309](https://github.com/PHACDataHub/sci-portal/issues/309) and [backstage/backstage#25056](https://github.com/backstage/backstage/issues/25056).

The failing unit tests are skipped to prevent this problem from affecting local development and the CI pipeline.

### Viewer Permissions

In order to focus on higher priority UI features Viewers do not have additional permissions defined in Backstage or in the Templates. This is tracked by [PHACDataHub/sci-portal#464](https://github.com/PHACDataHub/sci-portal/issues/464).

### Budget Alerts

As the usage of the Data Science Portal scales, consider replacing the minimum viable solution used to send email notifications. The current solution is documented in the [**budget-alerts/README.md**](https://github.com/PHACDataHub/sci-portal/blob/main/budget-alerts/README.md).

The team may also consider configuring a Cloud Build pipeline for Continuous Deployment.

## Changes to the Project Scope

A number of factors contributed to changes in scope including the required LDAP integration being unavailable, delays in accessing an email service, and a request to prioritize development in Backstage over infrastructure templates. This section documents how to continue working on the deprioritized features.

### RStudio and RShiny Cloud Workstation

Work on Collin Brown’s [template](https://github.com/PHACDataHub/infra-core/tree/cloud-workstation-template/cloud-workstation-template) was paused to prioritize other UI features. At the time work was stopped, we needed a decision if the container image can be built and owned as part of the Data Science Portal. The remainder of the implementation can follow the documentation to [Add A New Template](#add-a-new-template).

### "Parking" Over-Budget Projects

It is possible to "park" or shutdown an over-spending project to reduce costs.

If the infrastructure for a given template can be configured to reduce spending, create and label a Crossplane Composition for the "parked" state. Use the implementation pattern for [multi-cloud support](#multi-cloud-support) to choose which Composition/state to provision.

Add this functionality to Backstage by adding a [Custom Catalog Action](https://backstage.io/docs/features/software-catalog/catalog-customization#customize-actions) on the Catalog entities. This button should link to a new template that creates a Pull Request with the new "parked" state. Configure the button to be visible only to users with the [required permissions](https://backstage.io/docs/permissions/frontend-integration).

To automate "parking" over-budget projects, configure the Cloud Function that handles budget alert notifications to use the Backstage API to create a Pull Request.

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

### Deployment Status

As documented in [PHACDataHub/sci-portal#38](https://github.com/PHACDataHub/sci-portal/issues/38) Vedant and Rajan have made great progress on surfacing the status of managed resources up to the top-level Crossplane claim.

### Security Vulnerabilities

We did not prioritize surfacing vulnerabilities in Backstage to focus on other features. Our initial research did not find a Backstage plugin that provides this functionality, so both frontend and backend development in Backstage would be required.

We recommend the following requirements to help users achieve their goals:

- Only show epidemiologists vulnerabilities found in their own source code. Differentiate between vulnerabilities in code managed by the platform team, and vulnerabilities in an epidemiologist's code.

- Write Software Templates that store an epidemiologist's code where it is easily accessible for vulnerability scanning and management tools. For example, keep source code in repositories on GitHub or Secure Source Manager instead of storage buckets.

Implementing these recommendations will improve our ability to detect and fix vulnerabilities.

## Preparing for Production

This is a reference implementation that is not ready for production. We've listed a few areas for concern below but there are certainly more things to consider:

- Deploy in a hardened cluster
- Improve cluster secrets management
- Harden the Backstage Backend auth
- Harden the GitHub App integration
- Validate and sanitize all inputs
- Restrict the dataset used for the Cost Dashboard
- Consider using [Universal Crossplane](https://www.upbound.io/product/universal-crossplane) which has upstream security updates
- Remove excessive IAM Permissions
