# Assumes that all the necessary APIs have been enabled as well.
module "gen_ai" {
  source             = "github.com/GoogleCloudPlatform/rad-lab//modules/gen_ai"
  billing_account_id = var.billing_account_id
  organization_id    = var.organization_id
  folder_id          = var.folder_id


  create_project    = false
  project_id_prefix = "gen-ai-id" # placeholder
  enable_services   = false

  set_external_ip_policy          = false
  set_shielded_vm_policy          = false
  set_trustedimage_project_policy = false
}