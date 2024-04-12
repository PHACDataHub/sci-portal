locals {
  region = "northamerica-northeast1"
  gke_props = {
    name              = "phac-backstage"
    zones             = ["northamerica-northeast1-a", "northamerica-northeast1-b", "northamerica-northeast1-c"]
    ip_range_pods     = "gke-01-pods"
    ip_range_services = "gke-02-services"
  }
  kcc_props = {
    sa_account_id   = "phac-backstage-kcc-sa"
    sa_display_name = "phac-backstage-kcc-sa"
  }
  git_props = {
    sync_repo    = "git@github.com:FociSolutions/phac-data-science-portal-monorepo.git"
    sync_branch  = "main"
    sync_root_dir = "root-sync" 
  }
}