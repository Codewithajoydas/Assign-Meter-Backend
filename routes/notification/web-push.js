const express = require("express");
const router = express.Router();
const PushSubscription = require("../../models/pushSubscription");
const AuthMiddleware = require("../../middleware/authentication");

router.post(
  "/subscribe",
  AuthMiddleware,
  async (req, res) => {
    try {
      const user = req.user;

      const subscription = req.body;

      if (
        !subscription?.endpoint ||
        !subscription?.keys?.p256dh ||
        !subscription?.keys?.auth
      ) {
        return res.status(400).json({
          status: "error",
          message: "Invalid push subscription",
        });
      }

      await PushSubscription.findOneAndUpdate(
        {
          endpoint: subscription.endpoint,
        },
        {
          user: user._id,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
        {
          upsert: true,
          new: true,
        }
      );

      return res.status(201).json({
        status: "success",
        message: "Push subscription saved",
      });
    } catch (error) {
      console.error("Push subscription error:", error);

      return res.status(500).json({
        status: "error",
        message: "Failed to save push subscription",
      });
    }
  }
);

module.exports = router;