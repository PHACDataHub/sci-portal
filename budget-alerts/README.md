# Budget Alerts

This cloud function is designed to manage Google Cloud Budget alerts and send notification emails using the GC Notify service.

## Overview

The `manageBudgetAlerts` cloud function listens for budget alert events from Google Cloud Pub/Sub, processes these events, and sends notifications to specified recipients using the GC Notify service. This function helps in monitoring budget thresholds and alerting stakeholders when budgets are exceeded.

## Prerequisites

Ensure you have the following prerequisites set up before deploying and running the cloud function:

- A Google Cloud Platform project with Pub/Sub enabled.
- GC Notify account with the required API key and templates.
- Backstage platform set up with the necessary API keys and URIs.

## Environment Variables

Ensure the following environment variables are set:

- **BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN**: The static API key for authenticating requests to the Backstage platform.
- **BACKSTAGE_URI**: The base URL for the Backstage platform.
- **GC_NOTIFY_API_KEY**: The API key for authenticating with the GC Notify service.
- **GC_NOTIFY_ALERT_TEMPLATE_ID**: The template ID for budget alert notifications.
- **GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID**: The template ID for over budget notifications.
- **GC_NOTIFY_URI**: The base URL for the GC Notify service.

## Local Development

To serve the cloud function locally for development:

1. Ensure you have Node.js and npm installed.

2. Install the required dependencies:
   ```sh
   npm install
   ```
3. Run the function locally:
   ```sh
   task budget-alerts:dev
   ```

## Testing

To ensure the cloud function works as expected, it’s important to run tests both locally and in the cloud environment. Here are the steps:

1. Start the local Pub/Sub emulator:
   ```sh
   task budget-alerts:emulator
   ```
2. Register the topic and subscription:
   ```sh
   task budget-alerts:register
   ```
3. Publish a test message using the predefined message in `message.json`:
   ```sh
   task budget-alerts:publish
   ```

### Integration Testing

1. Deploy the function to a test environment.
2. Trigger the function with sample Pub/Sub messages and verify the email notifications are sent correctly.

## Troubleshooting

- **Failed to fetch project data**: Ensure the Backstage platform is accessible and the API key is correct.
- **Unable to send email notifications**: Verify the GC Notify API key and template IDs are correct.
- **Pub/Sub emulator issues**: Ensure the emulator is running and the topic and subscription are correctly registered.
