# Extensibility Report

## About this Document

### Purpose

This report outlines how to extend the reference implementation, documents known limitations, highlights concerns for a production deployment, and suggests next steps to implement features that were removed from scope.

### Intended Audience

This document is intended for the development team. The reader is expected to be familiar with Backstage, including the Catalog model, Software Templates, and the Permissions framework. Additionally, the reader should have an understanding of Crossplane concepts, including Providers, Managed Resources, Compositions, CompositeResourceDefinitions, Claims, and Usages.

### Background

PHAC engaged Google to build a reference implementation of a web app that provides self-service capabilities for users to provision infrastructure in Google Cloud. The contract specified the use of a GitOps approach initiated from Backstage templates, with changes reconciled using Config Sync. The infrastructure is defined using a combination of Crossplane, Config Connector, and Terraform.

The reference implementation is split between two repositories:

- [PHACDataHub/sci-portal-users](https://github.com/PHACDataHub/sci-portal-users) contains the `User`, `Group`, and infrastructure definitions
- [PHACDataHub/sci-portal](https://github.com/PHACDataHub/sci-portal) contains the rest of the reference implementation

## Extensibility

This section explains how to extend the reference implementation to add new templates, deploy combinations of templates, support multiple cloud providers, translations, and other concerns.

### Add A New Template

Before adding a new template, review the Backstage documentation on writing [Software Templates](https://backstage.io/docs/features/software-templates/) and [Crossplane Concepts](https://docs.crossplane.io/latest/concepts/).

We have established a convention that makes adding new templates quick and easy.

Templates are defined in the **[backstage/templates/](https://github.com/PHACDataHub/sci-portal/tree/main/backstage/templates)** directory. Backstage is configured to populate the Catalog from files match the pattern `backstage/templates/*/template.yaml`. To add a template that creates a new GCP Project, we recommend copying the **[backstage/templates/rad-lab-data-science/](https://github.com/PHACDataHub/sci-portal/tree/main/backstage/templates/rad-lab-data-science-create)** directory.

The template directory should contain the following files:

| Path | Description |
| - | - |
| **template.yaml** | The YAML manifest that contains the `Template` entity.<br><br>Set the `name`, `title`, and `description` in the `metadata`.<br>Consider changing the `spec.type` to match the Entity that will be created.|
| **pull-request-description.njk** | A Nunjucks template for the Pull Request description. The templates can reuse other templates using [template inheritance](https://mozilla.github.io/nunjucks/templating.html#template-inheritance). For example, we include the Project template using `{% extends "project-create/pull-request-description.njk" %}`.
| **pull-request-changes/** | A directory containing Nunjucks templates that are added to the Pull Request in the **[DMIA-PHAC/SciencePlatform/](https://github.com/PHACDataHub/sci-portal-users/tree/main/DMIA-PHAC/SciencePlatform)&lt;project-id&gt;/ directory** |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**catalog-info.yaml.njk** | A Nunjucks template that declares the Backstage Catalog Entities to add. This includes the `Component`/`Resource` to add, and `Group`s for the Editor and Viewer permissions. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**claim.yaml.njk** | Declares the Crossplane `Claim` used to provision infrastructure. |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**kustomization.yaml.njk** | Configures Config Sync to ignore the non-Kubernetes resources such as the Backstage resources in **catalog-info.yaml**. |

To write the Nunjucks templates with confidence, add corresponding unit tests in the **[backstage/packages/backend/src/plugins/scaffolder/templates/](https://github.com/PHACDataHub/sci-portal/tree/main/backstage/packages/backend/src/plugins/scaffolder/templates)** directory. Use the tests to assert that the Pull Request description and contents match our expectations.

Changes may be required to validate or modify the input parameters. This is handled in our custom action declared in **[backstage/packages/backend/src/plugins/scaffolder/actions/provisioner.ts](https://github.com/PHACDataHub/sci-portal/blob/main/backstage/packages/backend/src/plugins/scaffolder/actions/provisioner.test.ts)**.

The Pull Request creates a Crossplane `Claim` to provision new infrastructure. The corresponding `CompositeResourceDefinition` and `Composition` are declared in **[root-sync/base/crossplane/](https://github.com/PHACDataHub/sci-portal/tree/main/root-sync/base/crossplane)**. Be mindful to update the Kustomization Files to configure Config Sync to reconcile the manifests.

Define infrastructure using Crossplane following these principles:

* Define infrastructure exclusively using [Config Connector resources](https://cloud.google.com/config-connector/docs/reference/overview), when possible.  
The [`config-connector` CLI tool](https://cloud.google.com/config-connector/docs/how-to/import-export/overview) can help export resources.
* When infrastructure cannot be defined using exclusively Config Connector resources, use Terraform.
* Do not mix tools.
* Isolate the state between GCP Projects (or equivalent). Use the `Workspace` `providerConfigRef` to target a `ProviderConfig` that configures a state file for each project.
* Use Crossplane `Usage`s to ensure resources are deleted in the expected order.
* If the Crossplane Composition requires conditional statements, use [Composition Functions](https://docs.crossplane.io/latest/concepts/composition-functions/). It is a known limitation that [Patch and Transforms](https://docs.crossplane.io/latest/concepts/patch-and-transform/) do not support conditions.

If Terraform modules require modification they can be added to the [**templates/**](https://github.com/PHACDataHub/sci-portal/tree/main/templates) directory. The RAD Lab Data Science and Gen AI modules have been copied and modified there.

To add or refactor infrastructure with confidence there are corresponding [`chainsaw`](https://kyverno.github.io/chainsaw/latest/quick-start/run-tests/) tests in the **[tests/templates/](https://github.com/PHACDataHub/sci-portal/tree/main/tests/templates)** directory.

### Deploy Combinations of Templates

We recommend a few changes to deploy multiple templates into one GCP Project:

* Update the templates to prompt the user if they’d like to modify an existing GCP Project. We recommend using the [`OwnedEntityPicker`](https://backstage.io/docs/reference/plugin-scaffolder.ownedentitypickerfieldextension/) UI field to find entities.
* Update the `data-science-portal:template:get-context` custom action to use an existing project ID.
* Ensure the Crossplane resources will not conflict when more than one template is applied to the same project.
