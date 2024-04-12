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
