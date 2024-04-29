## Terraform Configuration for GKE Autopilot Cluster

This Terraform configuration creates a Google Kubernetes Engine (GKE) Autopilot cluster and sets up the required authentication and configuration.

**Steps**:

1. Open the `terraform.tfvars` file and add the following lines, replacing the placeholders with your actual values:
```
# Config Sync
project_id                     = "<your_project_id>"
config_sync_repo               = "<your_git_repo_SSH_URL>"
config_sync_target_environment = "test"

# Cloud Build
cloudbuildv2_connection                = "projects/<your_project_id>/locations/<your_region>/connections/<your_connection_name>"
cloudbuildv2_connection_region         = "<your_region>"
cloudbuildv2_connection_remote_uri     = "<your_git_repository_uri>"
cloudbuildv2_connection_trigger_branch = "<your_trigger_branch>"
```
2. Run the `bootstrap:init` task

**Key Components**

* **Providers**
    * `google`: Interacts with Google Cloud Platform (GCP) resources.
    * `kubernetes`: Manages Kubernetes resources within the cluster.
    * `kubectl`: Executes kubectl commands within Terraform.
    * `helm`: Manages Helm charts for deploying applications in the cluster.
* **Data Sources**
    * `google_client_config`: Retrieves GCP authentication information.
    * `module.gke.endpoint`: Accesses the endpoint of the GKE cluster.
    * `module.gke.ca_certificate`: Obtains the CA certificate for the cluster.
* **Resources**
    * `google_compute_network`: Creates a network for the GKE cluster.
    * `google_compute_subnetwork`: Creates a subnet within the network with specific IP ranges.
    * `module.gke`: Creates a GKE Autopilot cluster using a public Terraform module (`terraform-google-modules/kubernetes-engine/google//modules/beta-autopilot-public-cluster`).
    * `google_service_account`: Creates a GCP service account for cluster access.
    * `google_service_account_iam_member`: Grants the service account Workload Identity access.
    * `google_project_iam_member`: Assigns the service account an editor role in the GCP project.
    * `module.config_sync`: Configures Anthos Config Management (ACM) for policy enforcement using a public Terraform module (`terraform-google-modules/kubernetes-engine/google//modules/acm`).

**Dependencies**

The `module.config_sync` depends on enabling the following Google services in your project:

* Google Kubernetes Engine Hub API
* Anthos API
* Anthos Config Management API

**Additional Notes**

* The configuration retrieves specific properties like cluster name, region, and IP ranges from a local values file.
* A Git repository is referenced for configuration synchronization with ACM.