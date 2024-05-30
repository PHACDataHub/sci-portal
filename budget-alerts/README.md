# Budget Alerts

This cloud function manages Google Cloud Budget alerts and sends notification emails using GC Notify.

## Environment Variables

Ensure the following environment variables are set:

- **BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN**: Static API key for the Backstage platform.
- **BACKSTAGE_URI**: Base URL for the Backstage platform.
- **GC_NOTIFY_API_KEY**: API key for GC Notify service.
- **GC_NOTIFY_ALERT_TEMPLATE_ID**: ID of the template for budget alert notifications.
- **GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID**: ID of the template for over budget notifications.
- **GC_NOTIFY_URI**: Base URL for GC Notify service.

## Local Development

To serve the cloud function locally:

```
task budget-alerts:dev
```

## Local Emulator

Follow these steps to set up the local emulator:

1. Start the local Pub/Sub emulator:

```
task budget-alerts:emulator
```

2. Register the topic and subscription:

```
task budget-alerts:register
```

3. Publish a message (using the predefined message in `message.json`):

```
task budget-alerts:publish
```