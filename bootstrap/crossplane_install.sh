#!/bin/bash

# Assert the required environment variables are defined
for var in GCP_PROJECT_ID GCP_REGION KCC_SERVICEACCOUNT KCC_SERVICEACCOUNT_EMAIL; do
    if [ -z "${!var}" ]; then
        >&2 echo "Error: The $var environment variable must be defined."
        exit 1
    fi
done

# Create manifests for the GCP provider from templates
envsubst < ./crossplane/templates/gcp/controller-config.yaml > ./crossplane/providers/gcp/controller-config.yaml
envsubst < ./crossplane/templates/gcp/provider.yaml > ./crossplane/providers/gcp/provider.yaml
envsubst < ./crossplane/templates/gcp/provider-config.yaml > ./crossplane/providers/gcp/config/provider-config.yaml

# Create manifests for the Terraform provider from templates
envsubst < ./crossplane/templates/terrafrom/deployment-runtime-config.yaml > ./crossplane/providers/terraform/deployment-runtime-config.yaml
envsubst < ./crossplane/templates/terrafrom/provider.yaml > ./crossplane/providers/terraform/provider.yaml

# Get cluster credentials
gcloud container clusters get-credentials phac-backstage --region "$GCP_REGION" --project "$GCP_PROJECT_ID"

# Add Crossplane to the Helm repository
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update

# Install Crossplane
helm install crossplane \
  crossplane-stable/crossplane \
  --namespace crossplane-system \
  --create-namespace
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=crossplane --timeout=300s -n crossplane-system

# Add the Crossplane providers
kubectl apply -f crossplane/providers/gcp
kubectl apply -f crossplane/providers/terraform

# Wait for the Providers to be ready
kubectl wait --for=condition=ready pod -l pkg.crossplane.io/provider=provider-terraform -n crossplane-system --timeout=300s
kubectl wait --for=condition=ready pod -l pkg.crossplane.io/provider=provider-gcp-storage -n crossplane-system --timeout=300s

# Configure Crossplane providers
# Note: Providres CRDS are required to successfully apply the configurations
kubectl apply -f crossplane/providers/gcp/config
