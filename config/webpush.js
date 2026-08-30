const webpush = require("web-push");

const registerWebpush = () => {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
};

module.exports = registerWebpush;
