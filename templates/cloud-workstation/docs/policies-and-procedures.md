# Policies and Procedures

This document outlines the policies and procedures that enable secure data access, restricted exclusively to users involved with the project.

## Policies:

### GCP Environment Access

1. **Access Policy**:
    - By default, all teams instantiating this template agree to only access the GCP cloud console from a work device that is connected to the organization's virtual private network (VPN).
    - [BeyondCorp](https://cloud.google.com/beyondcorp?hl=en) will eventually be used to enforce context-aware access that only allows devices with IP addresses belonging to a VPN CIDR to access resources in a given GCP project. 

2. **Independent GCP Environment**:
    - Each project is isolated by creating a separate GCP project. VPC peering between different GCP projects is disabled at the organization level.
    - A restricted set of user identities will be permitted to access the GCP project that instantiates this template.

3. **Login Mechanisms**
    - Multi-Factor Authentication (MFA) is required for all users (a Yubikey is procured and mailed to each user), adding an extra layer of security for user login.
    - By default, all teams instantiating this template agree that only an Authenticator app may be used as a backup MFA option to the hardware security key provided. 

### Data Access:

1. **Uploads and Downloads**: 
    - By default, all teams instantiating this template agree that data uploads and downloads of any kind are strictly limited to organizational devices connected to the organization's VPN.
    - [BeyondCorp](https://cloud.google.com/beyondcorp?hl=en) will eventually be used to enforce the context-aware access described above.

2. **Access Control Lists**:
    - Since the GCP projects instantiating this template are already restricted to a limited set of users, the only users who have any access to data stored in Google Cloud Storage (GCS) buckets are users who already have access to the GCP project.
    - It is possible to provide further fine-grained access so that only a subset of these users have permission to view certain data. However, this requirement is not currently built into this template, so such use cases are not currently suitable for this template.
