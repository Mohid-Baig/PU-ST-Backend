// services/notificationService.js

// import admin from "firebase-admin";
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const serviceAccount = require("../config/serviceAccountKey.json");

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });

export const sendNotification = async (fcmToken, title, body, data = {}) => {
    // For now, just log the notification payload
    // so your app won’t crash while you don’t have Firebase credentials

    const message = {
        token: fcmToken,
        notification: { title, body },
        data,
    };

    console.log("🔔 Mock notification (Firebase not configured):", message);

    // Later, when you add serviceAccountKey.json, uncomment this:
    /*
    try {
        await admin.messaging().send(message);
        console.log("✅ Notification sent successfully");
    } catch (error) {
        console.error("❌ Error sending notification:", error);
    }
    */
};
