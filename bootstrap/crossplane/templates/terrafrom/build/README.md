This **Dockerfile** extends the Crossplane Terraform Provider image and installs the Google Cloud CLI (`gcloud`).

### Why do we need `gcloud`?

The `gcloud` CLI is required for the [Rad Lab](https://github.com/GoogleCloudPlatform/rad-lab/tree/v13.3.1/modules) modules that call it in a `local-exec` command like [**modules/gen_ai/main.tf**](https://github.com/GoogleCloudPlatform/rad-lab/blob/v13.3.1/modules/gen_ai/main.tf#L181-L188):

```tf
resource "null_resource" "ai_workbench_usermanaged_provisioning_state" {
  for_each = toset(google_notebooks_instance.ai_workbench_usermanaged[*].name)
  provisioner "local-exec" {
    command = "while [ \"$(gcloud notebooks instances list --location ${var.zone} --project ${local.project.project_id} --filter 'NAME:${each.value} AND STATE:ACTIVE' --format 'value(STATE)' | wc -l | xargs)\" != 1 ]; do echo \"${each.value} not active yet.\"; done"
  }
  depends_on = [google_notebooks_instance.ai_workbench_usermanaged]
}
```

### What is the Crossplane Terraform Provider base image?

The `provider-terraform` image is defined in [the **Dockerfile**](https://github.com/upbound/provider-terraform/blob/main/cluster/images/provider-terraform/Dockerfile) in the `upbound/provider-terraform` repo. It uses Alpine Linux.

### How do we install `gcloud`?

We can follow the [installation instructions](https://cloud.google.com/sdk/docs/install#linux) and Alpine [**Dockerfile**](https://github.com/GoogleCloudPlatform/cloud-sdk-docker/blob/master/alpine/Dockerfile) to install the required dependencies and `gcloud`.

### How do we maintain the image?

Set the version of `provider-terraform` and `gcloud` using the build arguments:

```
docker build \
  --build-arg=PROVIDER_TERRAFORM_VERSION=v0.15.0 \
  --build-arg=CLOUD_SDK_VERSION=475.0.0 \
  .
```