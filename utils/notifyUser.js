const pushSubscription = require("../models/pushSubscription");
const {
  sendPushNotification,
} = require("../services/pushNotification");

async function notifyUser(userId, notification) {
  const subscriptions =
    await pushSubscription.find({
      user: userId,
    });

  for (const subscription of subscriptions) {
    await sendPushNotification(
      {
        endpoint: subscription.endpoint,

        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      notification,
    );
  }
}