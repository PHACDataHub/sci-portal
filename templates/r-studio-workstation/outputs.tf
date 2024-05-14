# VPC Outputs

output "vpc_id" {
  description = "an identifier for the VPC network with format projects/{{project}}/global/networks/{{name}}"
  value       = module.private_cloud_workstation_instances.vpc_id
}

output "vpc_self_link" {
  description = "The URI of the created VPC."
  value       = module.private_cloud_workstation_instances.vpc_self_link
}

output "subnetwork_id" {
  description = "an identifier for the VPC subnetwork with format projects/{{project}}/regions/{{region}}/subnetworks/{{name}}"
  value       = module.private_cloud_workstation_instances.subnetwork_id
}

output "subnetwork_self_link" {
  description = "The URI of the created subnetwork."
  value       = module.private_cloud_workstation_instances.subnetwork_self_link
}

output "private_ip_alloc_id" {
  description = "an identifier for the private ip allocation with format projects/{{project}}/global/addresses/{{name}}"
  value       = module.private_cloud_workstation_instances.private_ip_alloc_id
}

output "private_ip_self_link" {
  description = "The URI of the created IP address."
  value       = module.private_cloud_workstation_instances.private_ip_self_link
}

# NAT Outputs

output "router_id" {
  description = "an identifier for the router with format projects/{{project}}/regions/{{region}}/routers/{{name}}"
  value       = module.private_cloud_workstation_instances.router_id
}

output "router_self_link" {
  description = "The URI of the created router."
  value       = module.private_cloud_workstation_instances.router_self_link
}

output "nat_id" {
  description = "an identifier for the NAT with format {{project}}/{{region}}/{{router}}/{{name}}"
  value       = module.private_cloud_workstation_instances.nat_id
}

# FW Rules Outputs
output "firewall_id" {
  description = "an identifier for the fw rules with format projects/{{project}}/global/firewalls/{{name}}"
  value       = module.private_cloud_workstation_instances.firewall_id
}

# DNS Outputs
output "dns_policy_id" {
  description = "an identifier for the dns policy with format projects/{{project}}/policies/{{name}}"
  value       = module.private_cloud_workstation_instances.dns_policy_id
}

output "googleapis-response-policy-rule_id" {
  description = "an identifier for the googleapis dns policy rule with format projects/{{project}}/responsePolicies/{{response_policy}}/rules/{{rule_name}}"
  value       = module.private_cloud_workstation_instances.googleapis-response-policy-rule_id
}

output "gcr-response-policy-rule_id" {
  description = "an identifier for the gcr dns policy rule with format projects/{{project}}/responsePolicies/{{response_policy}}/rules/{{rule_name}}"
  value       = module.private_cloud_workstation_instances.gcr-response-policy-rule_id
}

output "pkg-response-policy-rule_id" {
  description = "an identifier for the pkg.dev dns policy rule with format projects/{{project}}/responsePolicies/{{response_policy}}/rules/{{rule_name}}"
  value       = module.private_cloud_workstation_instances.pkg-response-policy-rule_id
}
