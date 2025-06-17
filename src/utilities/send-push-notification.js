const admin = require("../config/firebase"); // Adjust path based on where you initialized firebase-admin

/**
 * Sends a push notification to a device using FCM.
 * @param {string} deviceToken - FCM device token of the receiver
 * @param {string} title - Notification title
 * @param {string} body - Notification message body
 * @param {object} data - Optional additional data (key-value pairs)
 */
async function sendPushNotification(payload) {
  const { deviceToken, title, body, data = {} } = payload;
  try {
    const message = {
      token: deviceToken,
      notification: {
        title,
        body
      },
      data: { ...data }
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to send notification:", error);
    throw error;
  }
}

module.exports = sendPushNotification;
