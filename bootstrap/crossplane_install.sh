#!/bin/bash

# This file will:
#1. Loads environment variables from a .env file.
#2. Generates Crossplane provider configuration using environment variables.
#3. Validates the provided GCP credential file path.
#4. Installs Crossplane using Helm.
#5. Creates a Kubernetes secret with provided GCP credentials.
#6. Applies Crossplane provider resources using kubectl.
#7. Waits for provider resources to be ready.
#8. Applies Crossplane provider configuration using kubectl.


usage() {
    echo "Usage: $0 <gcp_credential_file>"
    echo "Example: $0 ./gcp-credential-file.json"
    exit 1
}

# Assert the required environment variables are defined
for var in GCP_PROJECT_ID GCP_REGION KCC_SERVICEACCOUNT KCC_SERVICEACCOUNT_EMAIL; do
    if [ -z "${!var}" ]; then
        >&2 echo "Error: The $var environment variable must be defined."
        exit 1
    fi
done

# Assert the required parameter is provided
if [ $# -ne 1 ]; then
    usage
fi

# Assert the credentials exist
credential_file=$1
if [ ! -f "$credential_file" ]; then
    >&2 echo "Error: The \"$credential_file\" file does not exist"
    exit 1
fi

# Fill in GCP templates
envsubst < ./crossplane/templates/gcp/controller-config.yaml > ./crossplane/providers/gcp/controller-config.yaml
envsubst < ./crossplane/templates/gcp/provider.yaml > ./crossplane/providers/gcp/provider.yaml
envsubst < ./crossplane/templates/gcp/provider-config.yaml > ./crossplane/providers/gcp/config/provider-config.yaml

# Fill in Terraform templates
envsubst < ./crossplane/templates/terrafrom/deployment-runtime-config.yaml > ./crossplane/providers/terraform/deployment-runtime-config.yaml
envsubst < ./crossplane/templates/terrafrom/provider.yaml > ./crossplane/providers/terraform/provider.yaml
envsubst < ./crossplane/templates/terrafrom/provider-config.yaml > ./crossplane/providers/terraform/config/provider-config.yaml


# Add crossplane helm repository
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update

# Install the Crossplane components using helm install
helm install crossplane \
  crossplane-stable/crossplane \
  --namespace crossplane-system \
  --create-namespace

# Wait for Helm installation to complete
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=crossplane --timeout=300s -n crossplane-system

# Create Kubernetes secret with provided GCP credentials
kubectl create secret generic tf-gcp-creds -n crossplane-system \
  --from-file=credentials="$credential_file"

# Apply crossplane providers
kubectl apply -f crossplane/providers/gcp
kubectl apply -f crossplane/providers/terraform


# Wait for provider pods to be ready
kubectl wait --for=condition=ready pod -l pkg.crossplane.io/provider=provider-terraform -n crossplane-system --timeout=300s
kubectl wait --for=condition=ready pod -l pkg.crossplane.io/provider=provider-gcp-storage -n crossplane-system --timeout=300s


# Apply crossplane providers config
# Note: Providres CRDS are required to successfully apply the configurations
kubectl apply -f crossplane/providers/gcp/config
kubectl apply -f crossplane/providers/terraform/config