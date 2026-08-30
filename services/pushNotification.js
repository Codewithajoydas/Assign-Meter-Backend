const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

async function sendPushNotification(subscription, data) {
  const payload = JSON.stringify(data);

  return webpush.sendNotification(
    subscription,
    payload,
  );
}

module.exports = {
  sendPushNotification,
};