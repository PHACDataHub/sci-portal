# Jupyter and RStudio Docker Images

The development environment provided to users through this template is [Cloud Workstations](https://cloud.google.com/workstations?hl=en), which is launched as a container instance from an OCI image. This template leverages [GCP Cloud Build](https://cloud.google.com/build?hl=en) triggers to build images specified with one or more `Dockerfile`s in a project-specific repository.

## Base Images

By default, the base images used for the Cloud Workstations is the Dockerhub hosted [RStudio image](https://hub.docker.com/r/rocker/rstudio/tags) from the [Rocker Project](https://rocker-project.org/).

Projects are free to deviate from these base images if their projects have different requirements. Moreover, the review of the images used in a concrete instantiation of this template would be covered under the Security Assessment and Authorization (SA&A) process for the specific project instantiating this template.

## Vulnerability Scanning and Upgrades

### OCI Image Scanning and Upgrades

This template supports building and scanning OCI images in the continuous integration pipeline of the project-specific repository that instantiates it. This could be achieved, for example, by using the [trivy-action](https://github.com/aquasecurity/trivy-action) GitHub Action based on [Aqua Security's Trivy](https://github.com/aquasecurity/trivy) vulnerability scanning tool.

It is also possible to enable [Artifact analysis and vulnerability scanning](https://cloud.google.com/artifact-registry/docs/analysis) in the Artifact Registry repository of the GCP project, which could be [enabled as an alternative](https://github.com/hashicorp/terraform-provider-google/issues/7644) to performing vulnerability scanning via CI pipeline.

If any CVEs above a certain threshold are found, the image can be upgraded, scanned again, and pushed to the project's artifact registry once the detected CVEs have been patched.

The specific method of vulnerability scanning should be reviewed as part of the project-specific SA&A process. However, all projects must demonstrate that they undergo regular vulnerability scans on the OCI images they build and use.

By default, the [Rocker RStudio](https://rocker-project.org/images/versioned/rstudio.html) image used undergoes image scanning as described in this section of the documentation.

### Cloud Workstation Upgrades

As per the upstream documentation on [Cloud Workstations architecture](https://cloud.google.com/workstations/docs/architecture#vpc-network), it is possible to configure cloud workstations to retain the persistent disk when the unerlying cloud VM is deleted via the setting cloud workstations' [reclaim policy](https://cloud.google.com/workstations/docs/customize-development-environment#reclaimpolicy). Setting this reclaim policy enables the persistent disk to be mounted to a newly created VM instance, thereby allowing the base VM instance to be periodically destroyed and recreated so that updates to the underlying operating system can happen.

## Image Builds

This template provisions a Cloud Build trigger to watch a project-specific Git repository. 

By default, we recommend using [Git tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging) to trigger image builds so that project teams can be intentional about upgrading their images. Moreover, if teams opt for a solution like Trivy for vulnerability scanning, they can defer tagging a commit until the CI pipeline for that commit passes the Trivy vulnerability scan. However, project teams are free to choose the mechanism through which image builds are triggered as this is a project-specific implementation detail.

GCP Cloud Build is always used to build the image and push it to the project's [Artifact regsitry](https://cloud.google.com/artifact-registry). The reason for this decision is that it eliminates the need for an external entity to authenticate with GCP and initiate an image push over the public internet. Instead, the image build occurs from an internal GCP service and the image push to the project's artifact registry occers over a private network connection rather than over the public internet.

# Role-Based Access Control

This section outlines the security features and access control measures for Jupyter notebooks and R Studio workstations.

## Personas and Workstation Roles

Access control for Jupyter and R Studio workstations is managed through Google Cloud's IAM roles. Different roles are assigned to each persona based on their responsibilities.

### 1. Epidemiologist/Data Scientist User

- **Role: Viewer**
  - **Access:**
    - Inherits viewer roles for both notebooks and workstations from the project-scoped `roles/viewer`.
    - Can list instances and view details of notebook and workstation instances.

- **Role: Service Account ActAs:**
  - **Access:**
    - Can act as the service account that runs in the VMs.
    - Allows connecting to and running instances on behalf of the service account.

- **Role: Workstation User:**
  - **Access:**
     - For R Studio workstation instances, has the role "Workstation User" to start and connect to the workstations instances.

## Key Security Features

- **Public IP Prevention:**
  - VMs running jupyter notebooks and R workstations are in the VPC subnet and do not have public IP addresses, protected by the network firewall rules.

- **Service Account Security:**
  - Service accounts have roles that align with their specific tasks, promoting the principle of least privilege.
  - Viewer role restricts the ability of the user to create own instances. So there is no instance that is possible outside the VPC subnet that can access the data.

- **Beyond Corp:**
  - Enabling context-aware access in the future to accessing notebook and workstation instances through the console by restricting access based on the IP address of the machine accessing the resources.

