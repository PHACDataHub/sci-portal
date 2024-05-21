ARG PROVIDER_TERRAFORM_VERSION=v0.16.0
FROM xpkg.upbound.io/upbound/provider-terraform:${PROVIDER_TERRAFORM_VERSION}

ARG CLOUD_SDK_VERSION=476.0.0
ENV CLOUD_SDK_VERSION=$CLOUD_SDK_VERSION

# Add the Google Cloud SDK tools to the PATH
ENV PATH /google-cloud-sdk/bin:$PATH

# Switch back to the root user to install gcloud
USER root
RUN if [ `uname -m` = 'x86_64' ]; then ARCH=x86_64; else ARCH=arm; fi; \
    apk --no-cache upgrade \
    && apk --no-cache add \
        curl \
        python3 \
        py3-crcmod \
        py3-openssl \
        bash \
        libc6-compat \
        openssh-client \
        git \
        gnupg \
    && curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-${CLOUD_SDK_VERSION}-linux-${ARCH}.tar.gz \
    && tar xzf google-cloud-cli-${CLOUD_SDK_VERSION}-linux-${ARCH}.tar.gz \
    && rm google-cloud-cli-${CLOUD_SDK_VERSION}-linux-${ARCH}.tar.gz \
    && gcloud config set core/disable_usage_reporting true \
    && gcloud config set component_manager/disable_update_check true \
    && gcloud --version
    
# Return to the USER from provider-terraform
USER 65532
