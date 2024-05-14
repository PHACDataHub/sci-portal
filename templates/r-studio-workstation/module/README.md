# Cloud Workstations Template

> [!WARNING]
> This documentation is still under development as this reference architecture is actively undergoing Security Assessment and Authorization (SA&A).

The purpose of the analytics environment template is to provide infectious disease surveillance teams with the tools to develop and maintain their own data ingestion, cleaning, and analysis process.

## Deployment Instructions

1. Clone this repo and checkout the appropriate branch (e.g. `git clone https://github.com/PHACDataHub/infra-core.git` --> `git checkout cloud-workstation-template`).
2. Create a service account for terraform in the GCP Project you want to deploy into. This service account must have the `Owner` role for the project.
3. Go to **APIs & Services** --> **Credentials** --> Click the terraform service account (this should look something like `terraform@<project-id>.iam.gserviceaccount.com`) --> Select **KEYS** --> **ADD KEY** --> **Create New Key** --> select **JSON** key type. **This JSON file should be treated as a sensitive value as it contains the private key for the service account**.
4. Place the service account key from Step 3 in the `example` directory. Rename it `terraform-sa-key.json` (**or another name that is explicitly `.gitignore`d**).
5. `cd example`
6. `touch terraform.auto.tfvars` (also `.gitignore`d). This file contains any overrides for default terraform variables. The code snippet inserted below these instructions shows an example that creates a single cloud workstation along with a single GCS bucket. See example of settings below 
7. `terraform init`
8. `terraform fmt`
9. `terraform validate`
10. `terraform plan`
11. Activate in your GCP Project
- Secret Manager API
- Artifact Registry API
- Cloud DNS API
- Identity and Access Management (IAM) API
- Stackdriver Monitoring API
- Service Networking API
- Cloud Build API
11. If the plan looks good, then `terraform apply`.

**Example of `terraform.auto.tfvars`. Fill <your...> fields**

```hcl
project                     = "<your project ID>"
gcs_labels                  = { "foo" : "bar" }
notification_channels_email = "<your email>"

# Cloud Build
cloudbuild_repo = "<Project Repository that this template is instantiated for>"

#[Your GH Personal Access Token] (https://github.com/settings/tokens/new?scopes=repo,admin:org,read:user,admin:enterprise&description=GH-TB-Key)
#The authorized user has to have the admin permission to repo PHACDataHub/tb-safe-inputs
github_pat = "<your GH Personal Access Token>"

github_cloudbuild_installation_id = "<Organization's cloudbuild install ID>"

# Cloud Workstations

project_principals = ["<your gcp email address>"]

google_cloud_workstation_clusters = {
  "tb-cluster" : {
    name : "tb-cluster"
    labels : {}
    annotations : {}
    configs : [{
      workstation : [

      ]
    }]
  }
}
google_cloud_workstation_configurations = {
  "rworkstation-config" : {
    workstation_cluster_id = "tb-cluster"
    idle_timeout           = "600s"
    running_timeout        = "21600s"
    replica_zones          = []
    annotations            = {}
    labels                 = {}
    host = {
      gce_instance = {
        machine_type                = "n1-standard-4"
        boot_disk_size_gb           = 100
        disable_public_ip_addresses = false
        service_account             = "your project default terraform service account"
      }
    }
    container = {
      image = "northamerica-northeast1-docker.pkg.dev/<your project ID>/tb-project/rstudio-env:rstudio-0.0.5"
      env = {
        NAME = "FOO"
        BABE = "bar"
      }
    }
  }
}
google_cloud_workstations = {
  "test-workstation" : {
    workstation_cluster_id : "tb-cluster"
    workstation_config_id : "rworkstation-config"
    labels : { "label" = "key" }
    env : { "name" = "foo" }
    annotations : { "label-one" = "value-one" }
  }
}
```

## Table of Contents

- [Networking Controls](./docs/network.md)
- [Storage Controls](./docs/bucket.md)
- [Jupyter and RStudio Images](./docs/jupyter-and-rstudio.md)
- [Policies and Procedures](./docs/policies-and-procedures.md)
- [Service Level Agreement](./docs/sla.md)

## Overview

Provinces and Territories email Excel files to PHAC Epidemiologists using [LiquidFiles](https://docs.liquidfiles.com/userguide.html). PHAC Epidemiologists upload these Excel files directly to a pre-configured [Google Cloud Storage (GCS) bucket](https://cloud.google.com/storage/docs/json_api/v1/buckets) via the Google Cloud Platform (GCP) console from a work device while connected to the VPN.

![analytics environment overview](./docs/diagrams/overview.svg)

PHAC Epidemiologists maintain R scripts for the following purposes outlined below.

### 1. Data Cleaning

PHAC Epidemiologists often have no control over the upstream infectious disease surveillance data sent to PHAC by the provinces and territories. Therefore, it is often the case that each province and territory sends the same data with many significant differences in formatting and table schema. These differences require that PHAC epidemiologists have the ability to convert this data to a common schema with a common set of formatting conventions so that the data can be used for national-level analysis and reporting.

To this end, PHAC Epidemiologists maintain a series of data cleaning R scripts.

All cleaned and validated data are written to a [Parquet](https://parquet.apache.org/) directory in the same GCS bucket.

### 2. Data Integration

In certain cases, after cleaning the upstream data sources received by the provinces and territories, there may be a data integration step. In this step, two or more data sources may be joined into a de-normalized analysis-ready table, and further data validations may be applied via R Scripts.

The integrated data are written to another Parquet directory in the same GCS bucket.

### 3. Data Analysis

Once the upstream data have been cleaned, integrated, and validated, the data are ready to be analyzed by PHAC Epidemiologists.

The PHAC Epidemiologists are free to use whichever programming language they prefer. However, they often opt for the [R programming language](https://www.r-project.org/about.html) as there are many open-source packages in the R ecosystem that facilitate epidemiological modelling and analysis.

The PHAC Epidemiologists produce a variety of artifacts from their analysis, including reports, plots, and aggregate data tables, which are exported from the analysis environment and downloaded back to the PHAC Epidemiologist's workstation (connected over VPN or from an on-premisis network) for downstream use.

The downloaded data, by default, are non-sensitive (e.g. aggregate-level data). However, the [Policies and Procedures](./docs/policies-and-procedures.md) document outlines how sensitive data would be exported from the environment if this requirement arises.

## Acknowledgements

This Terraform module is inspired by the [datatonic google secure vertex workbench](https://github.com/teamdatatonic/terraform-google-secure-vertex-workbench/tree/main) Terraform module.

## Helpful Resources

- [Provision Infrastructure on GCP with Terraform](https://developer.hashicorp.com/terraform/tutorials/gcp-get-started/google-cloud-platform-build)
