# Config Sync
project_id                     = "pht-01hsv4d2m0n"
config_sync_repo               = "git@github.com:FociSolutions/phac-data-science-portal-monorepo.git"
config_sync_target_environment = "test"

# Cloud Build
cloudbuildv2_connection                = "projects/pht-01hsv4d2m0n/locations/northamerica-northeast1/connections/FociSolutions"
cloudbuildv2_connection_region         = "northamerica-northeast1"
cloudbuildv2_connection_remote_uri     = "https://github.com/FociSolutions/phac-data-science-portal-monorepo.git"
cloudbuildv2_connection_trigger_branch = "main"
