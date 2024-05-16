# Assumes that all the necessary APIs have been enabled as well.
module "gen_ai" {
  source             = "github.com/GoogleCloudPlatform/rad-lab//modules/gen_ai"
  create_project    = false
  billing_account_id = var.billing_account_id
  folder_id          = var.folder_id
  project_id_prefix = var.project_id
  zone = "northamerica-northeast1-a"
  set_domain_restricted_sharing_policy = false
  set_trustedimage_project_policy = false
  set_external_ip_policy = flase
  set_shielded_vm_policy = false
  create_usermanaged_notebook = false
}