const UserDB = require("../models/user");
const PushSubscriptionDB = require("../models/pushSubscription");

const {
  sendPushNotification,
} = require("./pushNotification");

async function notifyAdminsOfNewMeters(pkg, meterCount) {
  // Find all admins belonging to this package
  const admins = await UserDB.find({
    role: "admin",
    pkg,
  }).select("_id");

  if (admins.length === 0) {
    return;
  }

  const adminIds = admins.map((admin) => admin._id);

  // Find all their push subscriptions
  const subscriptions =
    await PushSubscriptionDB.find({
      user: { $in: adminIds },
    });

  const notification = {
    title: "New Meters Submitted",
    body: `${meterCount} meter(s) have been submitted for approval.`,
    url: "/meters",
  };

  await Promise.allSettled(
    subscriptions.map((subscription) =>
      sendPushNotification(
        {
          endpoint: subscription.endpoint,

          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
        notification,
      )
    )
  );
}

module.exports = notifyAdminsOfNewMeters;