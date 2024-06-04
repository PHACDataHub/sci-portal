# Bootstrap the Cluster

This directory contains the resources to set up a Google Kubernetes Engine (GKE) Autopilot cluster, install Config Sync, and configure Crossplane to manage resources using Config Connector or Terraform. It will create an Artifact Registry, and add a Cloud Build trigger to build the Backstage container image.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)

## Prerequisites

### Tools

The following tools are required to bootstrap the cluster:

- git
- helm
- kubectl
- task
- terraform

#### (Optional) Devbox

We've used [Devbox](https://www.jetify.com/devbox/docs/installing_devbox/) to install and pin the dependency versions. If you [install Devbox](https://www.jetify.com/devbox/docs/installing_devbox/), just [start a new shell](https://www.jetify.com/devbox/docs/quickstart/#launch-your-development-environment) it will download the tools and create an isolated, reproducible environment:

```
devbox shell
```

### Permissions

The GitHub user needs to be an admin in order to create the Cloud Build Connection which will create a new Google Cloud Build GitHub App.

The GCP user needs the `folders.getIamPolicy` to access IAM policies at the folder level, the capability to assign `folderCreator` and `projectCreator` permissions to Service Accounts within folders, and organization-level privileges to allocate roles such as `billing.user` and `billing.costsManager`. The one-time Billing export to Big Query requires additional permissions to manage the billing accounts.

### GitHub

A GitHub repo should be created to use as the source of truth for the infrastructure as code and GitOps (this repo).

A GitHub App should be configured for backend authentication. For more information see the [GitHub Integration docs](#).

<!--TODO: Docs, Values for the Cert -->

### Google Cloud

A GCP Project should be created for the Data Science Portal. Find the following values on the [Cloud Resource Manager](https://console.cloud.google.com/cloud-resource-manager):

- Organization ID
- Project ID

The templates are deployed into a root GCP Folder. This can also be found in the Cloud Resource Manager:

- Root Folder ID (HC-DMIA > DMIA-PHAC > SciencePlatform)

<br>

Find the Billing Account ID. We need the Account ID, not the Master Account ID (reseller parent billing account).

```
gcloud billing accounts list
```

## Setup

### Enable the following APIs

- Artifact Registry API (`artifactregistry.googleapis.com`)
- Cloud Billing API (cloudbilling.googleapis.com)
- Cloud Billing Budget API (`billingbudgets.googleapis.com`)
- Cloud Build API (`cloudbuild.googleapis.com`)
- Secret Manager API (`secretmanager.googleapis.com`)
- Service Usage API (serviceusage.googleapis.com)

### Create a Cloud Build Connection

Create a Cloud Build Host Connection to the repository following [the docs](https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github#console). Store the following values to configure Terraform below:

- Region
- Name

This will create a new Google Cloud Build GitHub App. Ensure the new [GitHub App](https://github.com/organizations/PHACDataHub/settings/apps) is configured to have read access to the repo.

### Create the Cluster

Configure the values in **gke-cluster/terraform.tfvars**.

Authenticate using `gcloud` Application Default Credentials (ADC):

```
gcloud auth application-default login
gcloud config set project <project-id>
```

Run the following command to run Terraform:

```bash
task bootstrap:init
```

The Terraform output is required for the next step.

<!-- We can configure the repo to use a Service Account instead of an SSH Key. -->

### Add GitHub Deploy Keys

Follow [the docs](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys#set-up-deploy-keys) to add the SSH key to the GitHub repository as a read-only **Deploy Key**. This allows Config Sync to read from the repo.

The SSH key in the the Terraform output as `config-sync-cred`:

```
cd bootstrap/gke-cluster
terraform output
```

### Set Up Crossplane

#### Set Environment Variables

Configure the environment variables in **.env** in the parent directory. You can copy **.env.example** as a reference.

```
cp .env.example .env
```

The project ID and region (`northamerica-northeast1`) have already been used. Find the KCC Service Account details in the Terraform output.

#### Install Crossplane

Run the following task to install Crossplane, and the GCP and Terraform providers:

```bash
task bootstrap:crossplane
```

### Configure OAuth for the Backstage Google Authentication Provider

#### Create an OAuth Consent Screen

Create a new [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent).

For development:

- Use an Internal User Type, or External with explicit test users from other domains
- We no not need to set the App logo or App domain
- We do not need scopes

> [!TIP]
> Use a Google Group managed by you as the **User support email**.

#### Create Credentials

Create new [Credentials](https://console.cloud.google.com/apis/credentials?project) for an OAuth client ID for our Web application.

For development:

- Authorized JavaScript origins: `http://localhost:7007`
- Authorized redirect URIs: `http://localhost:7007/api/auth/google/handler/frame`

#### Create a Secret

Create a new Secret:

```sh
kubectl create secret generic -n backstage google-auth \
  --from-literal=AUTH_GOOGLE_CLIENT_ID="<client-id>" \
  --from-literal=AUTH_GOOGLE_CLIENT_SECRET="<client-secret>"
```

### Configure Database Access

Generate a new password for the Cloud SQL instance from the [Console](https://console.cloud.google.com/sql/instances).

Create a Secret with the new password:

```sh
kubectl create secret generic -n backstage postgres-secrets \
  --from-literal=POSTGRES_HOST="127.0.0.1" \
  --from-literal=POSTGRES_PORT=5432 \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD="<password>"
```

### Configure the GitHub Integration

The Backstage GitHub App was already created in the organization.

Create a file like **github-app-integration-credentials.yaml** that we'll add as a secret:

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

Fill in the values, using a new Client Secret and Private Key.

Create a Secret for the integration using the GitHub App:

```sh
kubectl create secret generic -n backstage backstage-github-app --from-file=github-app-integration-credentials.yaml
```

### Configure sci-portal-users repo sync

[Generate](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent#generating-a-new-ssh-key) a new SSH key and add the private key as a secret in your cluster. Config Sync will use this secret to access sci-portal-users when syncing.

```
kubectl create secret generic -n config-management-system sci-portal-users-git-creds --from-file=ssh=./<private-key>
```

> [!IMPORTANT]  
> You must add the generated public key as an SSH key or a deploy key on GitHub. https://github.com/PHACDataHub/sci-portal-users/settings/keys

### Configure Backstage Plugin-to-Plugin Auth

Follow [the documentation](https://backstage.io/docs/auth/service-to-service-auth) to create a token:

```sh
node -p 'require("crypto").randomBytes(24).toString("base64")'
```

Create a Secret with the token:

```sh
kubectl create secret generic -n backstage backstage-auth-keys \
  --from-literal=BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN="<token>"
```

### Configure the Backstage Backend

Create a ConfigMap for to configure the Backstage backend service:

```sh
kubectl create configmap -n backstage backstage-config \
  --from-literal=GITOPS_REPO_OWNER=<github-organization> \
  --from-literal=GITOPS_REPO_NAME="<github-repo>" \
  --from-literal=GCP_BILLING_ACCOUNT_ID="<gcp-billing-account-id>" \
  --from-literal=AUTH_GOOGLE_ALLOWED_DOMAINS="<expected-domains>"
  --from-literal=BACKSTAGE_URI="<backstage-uri>"
```

### Billing Export to BigQuery

It is a one-time setup to export Cloud Billing data to BigQuery.
Follow [the docs](https://cloud.google.com/billing/docs/how-to/export-data-bigquery-setup) to set it up.

The key points:

- Export daily costs
- Create the `billing_account_id` table
- Save the Table ID

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
