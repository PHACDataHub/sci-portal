## root-sync

This Module contains the Config Sync manifests to manage root-level resources in the Kubernetes cluster. Config Sync will install resources defined in this directory.

### Setup

Config Sync is installed when we bootstrap the Google Kubernetes Engine (GKE) cluster following the docs in [**bootstrap/**](../bootstrap/README.md). To access the Git repository, the SSH key pair generated during the script's execution must be added to the target Git repository's Deploy Keys.

### Contributing

Commit Kubernetes manifests for the root-level resources you want to synchronize (e.g., Cloud Storage buckets).

### References

- [Config Sync documentation](https://cloud.google.com/anthos-config-management/docs/config-sync-overview)
