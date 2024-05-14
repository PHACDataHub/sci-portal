locals {
  subnet_ip_cidr_range = "10.1.0.0/24"
  default_fw_rules = [
    {
      name                    = "egress-deny-all"
      description             = "Blanket default deny rule for egress"
      direction               = "EGRESS"
      priority                = 65535
      ranges                  = ["0.0.0.0/0"]
      source_tags             = null
      source_service_accounts = null
      target_tags             = null
      target_service_accounts = null
      allow                   = []
      deny = [{
        protocol = "all"
        ports    = null # All ports
      }]
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
    },
    {
      name                    = "ingress-deny-all"
      description             = "Blanket default deny rule for egress"
      direction               = "INGRESS"
      priority                = 65535
      ranges                  = ["0.0.0.0/0"]
      source_tags             = null
      source_service_accounts = null
      target_tags             = null
      target_service_accounts = null
      allow                   = []
      deny = [{
        protocol = "all"
        ports    = null # All ports
      }]
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
    },
    {
      name        = "egress-allow-tcp-git"
      description = "To allow connection to GitHub git endpoints - Egress"
      direction   = "EGRESS"
      priority    = 65534
      ranges = [
        "140.82.112.0/20",
      ]
      source_tags             = null
      source_service_accounts = null
      target_tags             = null
      target_service_accounts = null
      allow = [{
        protocol = "tcp"
        ports    = ["80", "443"]
      }]
      deny = []
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
    },
    {
      name                    = "egress-allow-private-gcp-services"
      description             = "Allow egress from instances in this network to the google service apis private range"
      direction               = "EGRESS"
      priority                = 65534
      ranges                  = ["199.36.153.8/30"]
      source_tags             = null
      source_service_accounts = null
      target_tags             = null
      target_service_accounts = null
      allow = [{
        protocol = "all"
        ports    = null # All ports
      }]
      deny = []
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
    },
    # At the time of writing, the GCP terraform module does not expose the workstation cluster control plane IP address.
    # Since we have an Egress deny all rule, we need to explicitly allow egress from a workstation VM to the control plane.
    # In the absence of the control plane IP being exposed by terraform, we need to use an overly permissive
    # rule allowing egress to any IP on the subnet CIDR. See https://github.com/hashicorp/terraform-provider-google/issues/17022
    # for more information.
    {
      name        = "egress-allow-intra-subnet"
      description = "Allow egress from instances in this network to the other instances in the network"
      direction   = "EGRESS"
      priority    = 65534
      ranges = [
        local.subnet_ip_cidr_range
      ]
      source_tags             = null
      source_service_accounts = null
      target_tags             = null
      target_service_accounts = null
      allow = [{
        protocol = "all"
        ports    = null # All ports
      }]
      deny = []
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
    },
    # At the time of writing, this is the specific IP resolved for the CRAN mirror hosted in a UWaterloo server
    # We need to periodically review and update this if they ever change due to infrastructure updates or if the mirror
    # is found inadequate for required packages.
    {
      name        = "egress-allow-cran-mirror"
      description = "Allow egress from instances in this network to the UWaterloo CRAN mirror"
      direction   = "EGRESS"
      priority    = 65534
      ranges = [
        "129.97.134.71"
      ]
      source_tags             = null
      source_service_accounts = null
      target_tags             = null
      target_service_accounts = null
      allow = [{
        protocol = "tcp"
        ports    = ["443"]
      }]
      deny = []
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
    }
  ]
  fw_rules = local.default_fw_rules
}

resource "google_compute_firewall" "fw_rules" {
  for_each                = { for rule in local.fw_rules : rule.name => rule }
  network                 = google_compute_network.vpc_network.name
  project                 = var.project
  name                    = each.value.name
  description             = each.value.description
  direction               = each.value.direction
  source_ranges           = each.value.direction == "INGRESS" ? each.value.ranges : null
  destination_ranges      = each.value.direction == "EGRESS" ? each.value.ranges : null
  source_tags             = each.value.source_tags
  source_service_accounts = each.value.source_service_accounts
  target_tags             = each.value.target_tags
  target_service_accounts = each.value.target_service_accounts
  priority                = each.value.priority

  dynamic "log_config" {
    for_each = lookup(each.value, "log_config") == null ? [] : [each.value.log_config]
    content {
      metadata = log_config.value.metadata
    }
  }

  dynamic "allow" {
    for_each = lookup(each.value, "allow", [])
    content {
      protocol = allow.value.protocol
      ports    = lookup(allow.value, "ports", null)
    }
  }

  dynamic "deny" {
    for_each = lookup(each.value, "deny", [])
    content {
      protocol = deny.value.protocol
      ports    = lookup(deny.value, "ports", null)
    }
  }
}
