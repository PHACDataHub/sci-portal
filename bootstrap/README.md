# Bootstrap the Cluster

This directory contains the resources to set up a Google Kubernetes Engine (GKE) Autopilot cluster, install Config Sync, and configure Crossplane to manage resources using Config Connector or Terraform. It will create an Artifact Registry, and add a Cloud Build trigger to build the Backstage container image.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)

## Prerequisites

### GitHub

A GitHub repo should be created to use as the source of truth for the infrastructure as code and GitOps (this repo). Prepare to copy/paste the following:

- GitHub Organization
- Repo

A GitHub App should be configured for backend authentication. For more information see the [GitHub Integration docs](#).

<!--TODO: Docs, Values for the Cert -->

### Google Cloud

A GCP Project should be created for the Data Science Portal. Find values for the following:

- Organization ID
  <!-- https://console.cloud.google.com/cloud-resource-manager -->
- Project ID
- Billing Account ID
  <!-- `gcloud billing accounts list` or https://console.cloud.google.com/billing/projects -->

The convention is to deploy templates under a GCP Folder hierarchy. To deploy templates we also need:

- Root Folder ID (DMIA-PHAC)

## Setup

### Cloud Build Connection

Create a Cloud Build Host Connection to the repository following [the docs](https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github#console). Store the following values for the:

- Region
- Name

### Configure GKE Cluster

Configure the values in **gke-cluster/terraform.tfvars**.

<!-- Authenticate to use the Google Cloud Provider for Terraform - https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference#authentication -->

Run the following command to provision the GKE cluster:

<!--
gcloud auth login
gcloud config set project river-sonar-415120
gcloud auth application-default login
-->

```bash
task bootstrap:init
```

<!-- We can configure the repo to use a Service Account instead of an SSH Key. -->

Save the SSH key in the Terraform output.

<!-- For example:
```
TODO
```
-->

### GitHub Deploy Keys

Follow [the docs](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#set-up-deploy-keys) to add the key to the GitHub repository as a **Deploy
Key**. This allows Config Sync to read from the repo.

### Set Up Crossplane

Configure the environment variables in **bootstrap/.env**. You can **.env.example** as a reference.

```
cp bootstrap/sample.env bootstrap/.env
```

<!-- TODO: Remove PHAC prefix. Move to root. -->

Prepare a valid GCP credential file.

Run the Crossplane setup script, providing the GCP credential file path as an argument:

```bash
task bootstrap:crossplane -- <gcp-credentials>
```

### Set Up Secrets

Crossplane needs a variety of secrets in order to connect to GitHub and CloudSQL.

1. Create a Secret for CloudSQL. The password for the Postgres user will need to be set using cloud console

   ```sh
   kubectl create secret generic postgres-secrets \
     --from-literal=POSTGRES_HOST="127.0.0.1" \
     --from-literal=POSTGRES_PORT=5432 \
     --from-literal=POSTGRES_USER=postgres \
     --from-literal=POSTGRES_PASSWORD="<password>"
   ```

2. Create a Secret for the Backstage GitHub integration:

   ```sh
   kubectl create secret generic backstage-github-app --from-file=github-app-integration-credentials.yaml
   ```

   The **github-app-integration-credentials.yaml** will look like:

   ```yaml
   # Name: Backstage-PHAC
   appId:
   # webhookUrl:
   clientId:
   clientSecret:
   webhookSecret:
   privateKey: |
     -----BEGIN RSA PRIVATE KEY-----
     ...
     -----END RSA PRIVATE KEY-----
   ```

3. Create a Secret for the Google Auth:

   ```sh
   kubectl create secret generic google-auth \
     --from-literal=AUTH_GOOGLE_CLIENT_ID="<client-id>" \
     --from-literal=AUTH_GOOGLE_CLIENT_SECRET="<client-secret>"
   ```

4. Create secret for Backstage backend-to-backend auth:

   ```sh
   node -p 'require("crypto").randomBytes(24).toString("base64")'

   kubectl create secret generic backstage-auth-keys \
     --from-literal=BACKSTAGE_AUTH_KEYS_0=[Value From Above Command]
   ```

   Save the key in a safe location in case it's needed later.

   <!-- TODO: Document it -->

5. Create a ConfigMap for to configure the Backstage backend service:

   ```sh
   kubectl create configmap backstage-config \
     --from-literal=GITOPS_REPO_OWNER=<github-organization> \
     --from-literal=GITOPS_REPO_NAME="<github-repo>" \
     --from-literal=GCP_BILLING_ACCOUNT_ID="<gcp-billing-account-id>"
   ```

## Components

**gke-cluster/**

- Contains Terraform configuration to create a GKE Autopilot cluster and authentication using service accounts and Workload Identity.
- Utilizes a public Terraform module for GKE provisioning.
- Employs a local values file for cluster properties.

**crossplane/**

- Offers a shell script for automated Crossplane installation, configuration, and GCP credential management.
- Generates Crossplane provider configuration for Terraform using environment variables from a `.env` file.
- Installs Crossplane with Helm and creates a Kubernetes secret for GCP credentials.
- Applies Crossplane provider resources for Terraform integration.
