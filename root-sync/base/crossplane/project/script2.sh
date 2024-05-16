#!/bin/bash

FOLDER_ID="108494461414"
SERVICE_ACCOUNT="phac-backstage-kcc-sa@pht-01hsv4d2m0n.iam.gserviceaccount.com"

# Function to install the program
install_program() {
    echo "Installing Resources..."
    kubectl apply -f xrd-project.yaml
    kubectl apply -f composition-project.yaml
    # kubectl apply -f claim.yaml
    echo "Installation complete!"
}

# Function to uninstall the program
uninstall_program() {
    echo "Uninstalling Resources..."
    # kubectl delete -f claim.yaml
    kubectl delete -f composition-project.yaml
    kubectl delete -f xrd-project.yaml
    echo "Uninstallation complete!"
}

# Check for command line arguments
if [ $# -ne 1 ]; then
    echo "Usage: $0 [-i | -u]"
    exit 1
fi

# Determine action based on flag
case $1 in
    -c)

        # Impersonate the service account and list folders
        gcloud resource-manager folders list --folder="$FOLDER_ID" --impersonate-service-account="$SERVICE_ACCOUNT"
        gcloud resource-manager folders list --folder="$FOLDER_ID" --impersonate-service-account="$SERVICE_ACCOUNT" | awk '/^phx-my-folder-4 / { print $2 }' > folder_id.txt
        extracted_folder_id=$(cat  folder_id.txt)
        folder_id=${extracted_folder_id##*/}
        rm -f folder_id.txt
        # echo "Extracted Folder ID: $folder_id"
        gcloud projects list --filter="parent=folders/978419638479" --impersonate-service-account="$SERVICE_ACCOUNT"
        ;;
    -i)
        install_program
        ;;
    -u)
        uninstall_program
        ;;
    *)
        echo "Invalid option: $1"
        echo "Usage: $0 [install | uninstall]"
        exit 1
        ;;
esac

# kubectl describe xtopics.ssubedir.org