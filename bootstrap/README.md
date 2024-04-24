## Bootstrap

This folder (`bootstrap`) provides the resources to set up a Google Kubernetes Engine (GKE) autopilot cluster  and configure Crossplane for managing GCP resources using Terraform within the cluster.

**Components:**

**gke-cluster:**
- Contains Terraform configuration to create a GKE autopilot cluster and authentication using service accounts and Workload Identity.
- Utilizes a public Terraform module for GKE provisioning.
- Employs a local values file for cluster properties.

**crossplane:**
- Offers a shell script for automated Crossplane installation, configuration, and GCP credential management.
- Generates Crossplane provider configuration for Terraform using environment variables from a `.env` file.
- Installs Crossplane with Helm and creates a Kubernetes secret for GCP credentials.
- Applies Crossplane provider resources for Terraform integration.

**Usage:**

1. **Configure GKE Cluster:**
- Ensure a `gke-cluster` folder exists within `bootstrap` with Terraform configuration files.
- Edit the local values file in `gke-cluster` to define your cluster properties.

```bash
# Provision GKE cluster
task bootstrap:init
```

Save the SSH key pair to configure access to the Config Sync.
<!-- Before we use a Service Account. -->

2. **Set Up Crossplane:**
- Create a `.env` file within `crossplane` to store the required environment variables (refer to sample.env).
- Prepare a valid GCP credential file.
- Run the Crossplane setup script, providing the GCP credential file path as an argument:

```bash
# Installs Crossplane and configures Terraform provider
task bootstrap:crossplane -- <path-to-gcp-creds>
```

3. **Set Up Secrets:**

Crossplan needs a variety of secrets in order to connect to GitHub and CloudSQL

1. Create Secret for CloudSQL. The password for the postgres user will need to be set using cloud console
```sh
kubectl create secret generic postgres-secrets \
  --from-literal=POSTGRES_HOST="127.0.0.1" \
  --from-literal=POSTGRES_PORT=5432 \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD="[password]"
```

2. Create secret for Backstage GitHub integration
```sh
 kubectl create secret generic backstage-github-app --from-file=github-app-integration-credentials.yaml
```

The github-app-integration-credentials.yaml fill will look like

```yaml
# Name: Backstage - Data Science Portal (PHAC)
appId: [App Id]
# webhookUrl: https://smee.io/bC1Ds14UBVLaZbg3OOb3
clientId: [Client Id]
clientSecret: [Client Secret]
webhookSecret: [Webhook Secret]
privateKey: |
[GitHub App Private Key]
```

3. Create secret for GitHub app auth
```sh
kubectl create secret generic github-auth \
  --from-literal=AUTH_GITHUB_CLIENT_ID="[Client Id]" \
  --from-literal=AUTH_GITHUB_CLIENT_SECRET="[Client Secret]"
```

4. Create secrete for Google Auth

```sh
kubectl create secret generic google-auth \
  --from-literal=AUTH_GITHUB_CLIENT_ID="[Client Id]" \
  --from-literal=AUTH_GITHUB_CLIENT_SECRET="[Client Secret]"
```

5. Create secret for backstage backend-to-backend auth

```sh

node -p 'require("crypto").randomBytes(24).toString("base64")'

kubectl create secret generic backstage-auth-keys \
  --from-literal=BACKSTAGE_AUTH_KEYS_0=[Value From Above Command]
```
Save the key in a safe location in case it's needed later.

6. Create configmap for Backstage Backend configurations
```sh
kubectl create configmap backstage-config \
  --from-literal=PROJECT_ID="<google-project-id>"\
```