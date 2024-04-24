#!/bin/bash

# Function to update the image tag
update_image_tag() {
  # Get the deployment file path and new tag from arguments
  deployment_file="$1"
  new_tag="$2"

  # Check if image tag was provided
  if [[ -z "$new_tag" ]]; then
    echo "Error: Please provide a new image tag."
    exit 1
  fi

  # Current image tag (improve error handling)
  current_tag=$(grep -Eo 'backstage:[^"]+' "$deployment_file" || true)
  if [[ -z "$current_tag" ]]; then
    echo "Warning: Could not find image tag in deployment file (continuing)."
  fi

  # Update the image tag in the file using sed
  sed -i "s/$current_tag/backstage:$new_tag/g" "$deployment_file"

  echo "Image tag updated to: backstage:$new_tag"
}

# Validate arguments
if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <deployment_file> <new_tag>"
  exit 1
fi

# Update the image tag
update_image_tag "$1" "$2"

echo "Successfully updated deployment file: $1"