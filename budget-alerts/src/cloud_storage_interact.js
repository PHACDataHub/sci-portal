const { Storage } = require('@google-cloud/storage');

// Initialize the Google Cloud Storage client
const storage = new Storage();

// TODO: Add the Storage bucket as an environment variable
const { STORAGE_BUCKET_FOR_BUDGET_EMAIL_VALIDATION } = process.env;

/**
 * Validate if email has already been sent for the combination of threshold exceeded + costIntervalStart
 * against existing data in cloud storage bucket
 * @param {object} message
 *
 * @return {Object} A Json object that contains a boolean value sendEmail and a string value alertEmailSentAt
 */
async function validateIfAlertEmailSent(message) {
    const projectId = message.budgetDisplayName;
    const alertThreshold = message.alertThresholdExceeded;
    const costIntervalStart = message.costIntervalStart;

    const bucketName = STORAGE_BUCKET_FOR_BUDGET_EMAIL_VALIDATION;

    const fileName = projectId + "_budgetAlertSent.json";
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    try {
        // Check if the file exists
        const [exists] = await file.exists();
        let data = {};

        if (!exists) {
            // Create a new JSON file with initial JSON Structure if it doesn't exist
            data = generateJson();
            await file.save(JSON.stringify(data, null, 2));
            console.log(`Created new file ${fileName} in ${bucketName}`);
        } else {
            // Read existing data
            const [contents] = await file.download();
            data = JSON.parse(contents.toString());
            console.log(`Read existing data from ${fileName} in ${bucketName}`);
        }

        var sendEmail = true;
        var alertEmailSentAt = new Date().toISOString();

        var threshold = data["alertsSent"]["thresholds"][alertThreshold];

        for (alertSent in threshold) {
            if (costIntervalStart == threshold[alertSent]["costIntervalStart"]) {
                sendEmail = false;
                alertEmailSentAt = threshold[alertSent]["alertEmailSentAt"];
                break;
            }
        }
        console.log("Send email set to .... " + String(sendEmail));

        // If sendEmail is set to true, insert an entry into the respective threshold breached
        if (sendEmail) {
            newAlert = {
                costIntervalStart: costIntervalStart,
                alertEmailSentAt: alertEmailSentAt
            }
            data["alertsSent"]["thresholds"][alertThreshold].push(newAlert);
        }


        // Write the updated data back to the file
        await file.save(JSON.stringify(data, null, 2));

        console.log(`Data written to ${fileName} in ${bucketName}`);
    } catch (error) {
        console.error('Error managing JSON data:', error);
        throw error; 
    }

    response = {
        sendEmail: sendEmail,
        alertEmailSentAt: alertEmailSentAt
    }
    return JSON.stringify(response);
}

function generateJson() {
    var alertThresholds = [0.25, 0.5, 0.75, 0.9, 0.95, 1.0, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19, 1.2]
    var thresholds = {}
    for (level in alertThresholds) {
        var threshold = alertThresholds[level];
        thresholds[threshold] = [];
    }

    var alertsSent = {
        thresholds: thresholds
    }

    var alertsJson = {
        alertsSent: alertsSent
    }
    return JSON.parse(JSON.stringify(alertsJson));
}

module.exports = {
    validateIfAlertEmailSent,
};

