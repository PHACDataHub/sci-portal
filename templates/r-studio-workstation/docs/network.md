# Network Overview

![network-diagram](./diagrams/network-overview.svg)

**Notes**

- The CIDR `10.0.0.0/XX` is used as a stand-in for a dynamically allocated RFC 1918 private IP address from the subnet.

# Networking Components

## VPC and Subnet

The network for the Cloud Workstation Template consists of a single [custom-mode VPC network](https://cloud.google.com/vpc/docs/vpc) and a single [regional subnetwork](https://cloud.google.com/vpc/docs/subnets) resource, which is hard-coded to [`northamerica-northeast1`](https://cloud.google.com/compute/docs/regions-zones) (i.e. Montréal). All notebook virtual machines are in this subnet.

## Cloud Network Address Translation (NAT)

[GCP Cloud NAT](https://cloud.google.com/nat/docs/overview) allows certain resources to create **outbound** connections to the internet. Address translation is only supported for inbound **response** packets only; no unsolicited inbound connections are allowed. A **regional** (i.e. `northamerica-northeast1`) external IP address for the cloud NAT instance is [automatically provisioned](https://cloud.google.com/nat/docs/ports-and-addresses) when the Cloud NAT resource is provisioned.

## Firewall

All outgoing traffic is evaluated against VPC-wide [firewall rules](https://cloud.google.com/compute/docs/reference/rest/v1/firewalls), with a default deny rule for all egress. An exception is made for GitHub public IPs so that users can use GitHub for source control.


| FW Rule Name                        | Direction | Priority | Ranges            | Ports     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------- | --------- | -------- | ----------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `egress-deny-all`                   | egress    | 65535    | `0.0.0.0/0`       | all       | All egress is denied by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `ingress-deny-all`                  | ingress   | 65535    | `0.0.0.0/0`       | all       | All ingress is denied by default.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `egress-allow-tcp-git`              | egress    | 65534    | `140.82.112.0/20` | `80, 443` | Corresponding rule to `ingress-allow-tcp-git`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `egress-allow-private-gcp-services` | egress    | 65534    | `199.36.153.8/30` | all       | Allow egress from instances on this network to the [IP range for `private.googleapis.com`](https://cloud.google.com/vpc/docs/configure-private-google-access-hybrid), which is only routable from within Google Cloud.                                                                                                                                                                                                                                                                                                                    |
| `egress-allow-cran-mirror`          | egress    | 65534    | `129.97.134.71`   | `443`     | Allow egress from instances in this network to the UWaterloo CRAN mirror to install R packages. At the time of writing, this is the specific IP resolved for the CRAN mirror hosted in a UWaterloo server. We need to periodically review and update this if they ever change due to infrastructure updates or if the mirror is found inadequate for required packages. If changed, the default mirror also has to be set in the [environment image](https://github.com/PHACDataHub/tb-safe-inputs/blob/main/rstudio-image/Rprofile.site) |
| `egress-allow-intra-subnet`         | egress    | 65534    | `10.0.0.0/xx`     | all ports | At the time of writing, the GCP terraform module does not expose the workstation cluster control plane IP address. Since we have an Egress deny all rule, we need to explicitly allow egress from a workstation VM to the control plane. In the absence of the control plane IP being exposed by terraform, we need to use an overly permissive rule allowing egress to any IP on the subnet CIDR. See [this github issue](https://github.com/hashicorp/terraform-provider-google/issues/17022) for more information.                     |

**Notes**:

- The whitelisted IP address for [pypi.org](https://pypi.org) was obtained with a `dig` query, and the whitelisted IP address for Fastly can be found from their [public IP list](https://api.fastly.com/public-ip-list). The purpose of whitelisting these IP addresses is that the `post_startup_script.sh` shell script can be used to install project-specific Python packages so they are available in the base Python virtual environment. **TODO**: In the future, this could be changed to proxy package installs through an artifact registry (e.g. [Artifactory](https://jfrog.com/artifactory/) or similar product) rather than installing directly from the upstream source.
- The whitelisted IP for the CRAN mirror was obtained with a `dig` query for the server that was found in [CRAN's official website](https://cran.r-project.org/mirrors.html). The purpose of whitelisting these IPs is for workstation users to install required R packages. **TODO**: In the future, this could be changed to proxy package installs through an artifact registry (e.g. [Artifactory](https://jfrog.com/integration/cran-packages-repository/) or similar product) rather than installing directly from the upstream source.

## Access via Authenticated HTTPS Proxy

To the best of our knowledge, Cloud Workstation instances use an [Inverting Proxy](https://github.com/google/inverting-proxy) to enable `https` connections between a user on the public internet and a notebook on the private subnetwork. The diagram below (borrowed from Inverting Proxy documentation) shows the high-level request flow when a client accesses the notebook via the inverting proxy.

> TODO: we should verify this mechanism with someone from GCP to verify this is actually what's happening.

```
+--------+         +-------+         +-------+         +---------+
| Client |         | Proxy | <-(1)-- | Agent |         | Backend |
|        | --(2)-> |       |         |       |         |         |
|        |         |       | --(3)-> |       |         |         |
|        |         |       |         |       | --(4)-> |         |
|        |         |       |         |       | <-(5)-- |         |
|        |         |       | <-(6)-- |       |         |         |
|        | <-(7)-- |       |         |       |         |         |
|        |         |       | --(8)-> |       |         |         |
+--------+         +-------+         +-------+         +---------+
```

Neither the `proxy-forwarding-agent` ("Agent") nor the JupyterLab server ("Backend") are accessible from the public internet. The `proxy-forwarding-agent` initiates an outgoing request to a Google-managed proxy server, and this proxy server waits for incoming client requests on the public internet.

As part of the startup process of the Jupyterlab server (also managed by Google), the `proxy-forwarding-agent` sets up a connection with a Google-managed proxy server, and the proxy server provides a public URL that it is listening for requests on. The format of this URL will look something like `https://<random characters>-dot-<region>.notebooks.googleusercontent.com`. Users who visit this URL are taken though an [OAuth2.0 flow](https://oauth.net/2/) for authentication and authorization.

Authenticated and authorized users have their request to the proxy server forwarded to the `proxy-forwarding-agent` that initiated the original request. The `proxy-forwarding-agent` forwards traffic to the Jupyterlab server. The Jupyterlab server responds to the `proxy-forwarding-agent`, which responds to the proxy server, which responds to the client that made the request.

## DNS

Following the example of Datatonic's [terrafrom-google-secure-vertex-workbench](https://github.com/teamdatatonic/terraform-google-secure-vertex-workbench/tree/main) terraform module, we create private [DNS response policy rules](https://cloud.google.com/dns/docs/zones/manage-response-policies) to map DNS records to GCP's [IP range for `private.googleapis.com`](https://cloud.google.com/vpc/docs/configure-private-google-access-hybrid) rather than using Google's public IP ranges.

Specifically, DNS queries matching `*.googleapis.com`, `*.gcr.io`, or `*.pkg.dev` are routed to an IP address in `199.36.153.8/30`.

# Network Flows

This section outlines the details of each network flow.

## Notebook Server Instances to Google Services

The following operations involve network flows between the VM running the notebook instances and a google managed proxy server, that handles all requests to Google services:

- Notebook Startup and Authentication
- Image pull from Artifact Registry to VM instance
- Reading/writing data from Google Cloud Storage to VM instance

| **Source IP/CIDR** | **Source Port** | **Dest IP/CIDR**  | **Dest Port** | **Protocol No.** | **Extra Details**                                                                                                        |
| ------------------ | --------------- | ----------------- | ------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `10.0.0.0/XX`      | Ephemeral       | `199.36.153.8/30` | 443           | 6 (TCP)          | `forwarding-proxy-agent` initiates https connection to Google-managed proxy server via `private.googleapis.com` service. |
| `199.36.153.8/30`  | Ephemeral       | `10.0.0.0/XX`     | 443           | 6 (TCP)          | Source IP is from Google-managed proxy server, forwarding https user traffic to notebook sever.                          |


**Notes**

- 199.36.153.8/30 refers to the [IP range for `private.googleapis.com`](https://cloud.google.com/vpc/docs/configure-private-google-access-hybrid). These IPs are only routable from within Google Cloud.

## Cloud Workstation to Workstation Cluster Control Plane Network Flow

| **Source IP/CIDR** | **Source Port** | **Dest IP/CIDR** | **Dest Port** | **Protocol No.** | **Extra Details**                                                                                                                                                  |
| ------------------ | --------------- | ---------------- | ------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `10.x.x.x`         | Ephemeral       | `10.x.x.x`       | [Port]        | [Protocol]       | Bidirectional communication between the cloud workstation and the workstation cluster control plane, for initialization, configuration updates and health updates. |

**Notes:**

- One IP from the private IP range is assigned to the control plane of the workstation cluster.

This network flow facilitates seamless interaction and coordination between the cloud workstation and the central control plane components of the workstation cluster.


**Notes**
- We enable certain python packages to be installed as part of the post-install script, so network flows to specific upstream package repositories must be allowed.

## Installation of R packages from CRAN Mirror for Workstation VM

| **Source IP/CIDR** | **Source Port** | **Dest IP/CIDR** | **Dest Port** | **Protocol No.** | **Extra Details**                                                                              |
| ------------------ | --------------- | ---------------- | ------------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| `10.0.0.0/XX`      | Ephemeral       | `129.97.134.71`  | 443           | 6 (TCP)          | Workstation VM initiates HTTPS connection to CRAN mirror for package information and downloads |
| `129.97.134.71`    | 443             | `10.0.0.0/XX`    | Ephemeral     | 6 (TCP)          | Response from CRAN mirror with package information and files for installation                  |

**Notes**
- We enable workstation users to install R packages in their sessions in the workstation instances, so network flows to the upstream CRAN mirror must be allowed.

## Github Clone Repository

| **Source IP/CIDR** | **Source Port** | **Dest IP/CIDR**  | **Dest Port** | **Protocol No.** | **Extra Details**                               |
| ------------------ | --------------- | ----------------- | ------------- | ---------------- | ----------------------------------------------- |
| `10.0.0.0/XX`      | Ephemeral       | `140.82.112.0/20` | 443           | 6 (TCP)          | NAT from `10.0.0.0/XX` to regional external IP. |
| `140.82.112.0/20`  | 443             | `10.0.0.0/XX`     | Ephemeral     | 6 (TCP)          | NAT from regional external IP to `10.0.0.0/XX`. |

**Notes**

- As per the [GitHub metadata API](https://api.github.com/meta), GitHub uses Public IP addresses from the range 140.82.112.0/20.
- All egress is routed through a NAT Gateway router, so all private source IPs are translated to a public IP via the NAT Gateway.

## Downloading/Uploading files via Cloud console:

**Notes**
- Communication between user workstations and Google Cloud Storage via the Cloud console is over the public internet. The confidentiality and integrity of data is protected via HTTPS encryption. 
- Although communication occurs over the public internet, all teams instantiating this template agree to access the Cloud console to upload/download data from Cloud Storage only on the official workstations connected to the organization's VPN.
- Going forward, Beyond Corp will be used to enforce context awareness to permit access to the Cloud console only from devices with an IP address belonging to a VPN CIDR.
- More information can be found in the [Policies and Procedures](./policies-and-procedures.md). 

## Attribution

- [R Icon SVG](https://www.r-project.org/logo/Rlogo.svg) borrowed from R Project website.
- [GCP Cloud Workstation Icon SVG](https://cloud.google.com/docs) borrowed from GCP documentation.
