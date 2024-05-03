# Modify the `google-cloud-sdk` Devbox package

We want to use Devbox to manage dependencies like the `gcloud` CLI. Unfortunately when we try to install components like the `gke-gcloud-auth-plugin` from the Devbox shell we get an error:

```
$ gcloud components install gke-gcloud-auth-plugin
ERROR: (gcloud.components.install) You cannot perform this action because this Google Cloud CLI installation is managed by an external package manager.
Please consider using a separate installation of the Google Cloud CLI created through the default mechanism described at: https://cloud.google.com/sdk/
```

The workaround in this directory is documented in https://github.com/jetify-com/devbox/issues/1498#issuecomment-1734551727.

Good luck and have fun!
