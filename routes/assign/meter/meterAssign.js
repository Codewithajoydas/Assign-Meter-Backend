const express = require("express");
const router = express.Router();
const MeterDB = require("../../../models/meter");
const UserDB = require("../../../models/user");
const PushSubscriptionDB = require("../../../models/pushSubscription");
const { broadcast } = require("../../../config/sse.config");
const isValidMeterNumber = require("../../../utils/isValidMeterNumber");
const cleanMeterNumber = require("../../../utils/cleanMeterNumber");
const AuthMiddleware = require("../../../middleware/authentication");
const { allowRoles } = require("../../../middleware/rbac");
const webpush = require("web-push");
router.use(AuthMiddleware);

router.use(
  allowRoles(
    "admin",
    "superadmin",
    "supervisor",
  ),
);

router.post("/", async (req, res) => {
  console.log("\n=================================================");
  console.log("CREATE METER REQUEST STARTED");
  console.log("=================================================");

  try {
    const user = req.user;
    console.log("[AUTH] User:", {
      id: user?._id?.toString(),
      name: user?.name,
      role: user?.role,
      pkg: user?.pkg,
    });

    if (!user) {
      console.log("[AUTH] No authenticated user");

      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }
    const {
      meterNumber,
      equipCategory,
      meterType,
      installationType,
      storeLocation,
      agency,
      installerId,
    } = req.body;

    console.log("[REQUEST] Body received:", {
      meterNumberCount: Array.isArray(meterNumber)
        ? meterNumber.length
        : "not-array",

      equipCategory,
      meterType,
      installationType,
      storeLocation,
      agency,
      installerId,
    });


    if (
      !meterNumber ||
      !equipCategory ||
      !meterType ||
      !installationType ||
      !storeLocation ||
      !agency ||
      !installerId
    ) {
      console.log("[VALIDATION] Missing required fields");
      return res.status(400).json({
        status: "error",
        message: "Please provide all details",
      });
    }

    console.log("[VALIDATION] Required fields passed");


    if (!Array.isArray(meterNumber)) {
      console.log("[VALIDATION] meterNumber is not an array");

      return res.status(400).json({
        status: "error",
        message: "meterNumber must be an array",
      });
    }

    console.log("[VALIDATION] meterNumber is array");

    const cleanedMeters = meterNumber
      .map(cleanMeterNumber)
      .filter(Boolean);

    console.log("[METERS] Original count:", meterNumber.length);

    console.log(
      "[METERS] Cleaned count:",
      cleanedMeters.length,
    );

    if (cleanedMeters.length === 0) {
      console.log("[METERS] No valid meters after cleaning");

      return res.status(400).json({
        status: "error",
        message: "No valid meter numbers provided",
      });
    }

    const invalidMeters = cleanedMeters.filter(
      (meter) => !isValidMeterNumber(meter),
    );

    console.log(
      "[METERS] Invalid count:",
      invalidMeters.length,
    );

    if (invalidMeters.length > 0) {
      console.log(
        "[METERS] Invalid meters:",
        invalidMeters,
      );

      return res.status(400).json({
        status: "error",
        message: `Invalid meter numbers: ${invalidMeters.join(", ")}`,
      });
    }

    const uniqueMeters = [...new Set(cleanedMeters)];

    console.log(
      "[METERS] Unique count:",
      uniqueMeters.length,
    );

    console.log("[DB] Checking existing meters...");

    const existing = await MeterDB.find({
      meterNumber: {
        $in: uniqueMeters,
      },
      agency,
      installerId,
    })
      .select("meterNumber")
      .lean();

    console.log(
      "[DB] Existing meters found:",
      existing.length,
    );

    if (existing.length > 0) {
      console.log(
        "[DB] Duplicate meters:",
        existing.map(
          (meter) => meter.meterNumber,
        ),
      );

      return res.status(400).json({
        status: "error",
        message: `Some meters already sent: ${existing
          .map((meter) => meter.meterNumber)
          .join(", ")}`,
      });
    }

    const metersData = uniqueMeters.map((meter) => ({
      meterNumber: meter,
      equipCategory,
      meterType,
      installationType,
      storeLocation,
      agency,
      installerId,

      supervisor: user._id,
      pkg: user.pkg,
    }));

    console.log(
      "[DB] Prepared meters:",
      metersData.length,
    );

    console.log("[DB] Inserting meters...");

    const inserted = await MeterDB.insertMany(
      metersData,
      {
        ordered: false,
      },
    );

    console.log(
      "[DB] Meters inserted successfully:",
      inserted.length,
    );

    console.log("[PUSH] Finding admins...");

    const admins = await UserDB.find({
    })
      .select("_id name email role pkg")
      .lean();

    console.log(
      "[PUSH] Admins found:",
      admins.length,
    );

    console.log(
      "[PUSH] Admin IDs:",
      admins.map((admin) =>
        admin._id.toString(),
      ),
    );

    if (admins.length > 0) {
      const adminIds = admins.map(
        (admin) => admin._id,
      );

      console.log(
        "[PUSH] Looking for subscriptions for admin IDs:",
        adminIds.map((id) => id.toString()),
      );

      const subscriptions =
        await PushSubscriptionDB.find({
          user: {
            $in: adminIds,
          },
        })
          .select("_id user endpoint keys")
          .lean();

      console.log(
        "[PUSH] Subscriptions found:",
        subscriptions.length,
      );

      console.log(
        "[PUSH] Subscription details:",
        subscriptions.map(
          (subscription) => ({
            id: subscription._id.toString(),

            user:
              subscription.user?.toString(),

            endpoint:
              subscription.endpoint,

            hasP256dh:
              Boolean(
                subscription.keys?.p256dh,
              ),

            hasAuth:
              Boolean(
                subscription.keys?.auth,
              ),
          }),
        ),
      );

      const payload = JSON.stringify({
        title: "New Meter Added",

        body: `${user.name} has submitted ${inserted.length} meter(s) for approval.`,

        url: "/meter",
      });

      console.log(
        "[PUSH] Payload:",
        payload,
      );

      if (subscriptions.length === 0) {
        console.log(
          "[PUSH] No subscriptions found. Nothing to send.",
        );
      } else {
        console.log(
          `[PUSH] Sending to ${subscriptions.length} subscription(s)...`,
        );

        const results =
          await Promise.allSettled(
            subscriptions.map(
              async (subscription) => {
                console.log(
                  "[PUSH] Sending to subscription:",
                  subscription._id.toString(),
                );

                try {
                  const result =
                    await webpush.sendNotification(
                      {
                        endpoint:
                          subscription.endpoint,

                        keys:
                          subscription.keys,
                      },
                      payload,
                    );

                  console.log(
                    "[PUSH] SUCCESS:",
                    {
                      subscriptionId:
                        subscription._id.toString(),

                      userId:
                        subscription.user.toString(),

                      statusCode:
                        result.statusCode,
                    },
                  );

                  return {
                    success: true,
                    subscriptionId:
                      subscription._id,
                  };
                } catch (error) {
                  console.error(
                    "[PUSH] FAILED:",
                    {
                      subscriptionId:
                        subscription._id.toString(),

                      userId:
                        subscription.user?.toString(),

                      statusCode:
                        error.statusCode,

                      message:
                        error.message,

                      body:
                        error.body,
                    },
                  );

                  // -------------------------------------------
                  // DELETE DEAD SUBSCRIPTION
                  // -------------------------------------------

                  if (
                    error.statusCode === 404 ||
                    error.statusCode === 410
                  ) {
                    console.log(
                      "[PUSH] Removing invalid subscription:",
                      subscription._id.toString(),
                    );

                    await PushSubscriptionDB.deleteOne({
                      _id: subscription._id,
                    });

                    console.log(
                      "[PUSH] Invalid subscription removed",
                    );
                  }

                  return {
                    success: false,
                    subscriptionId:
                      subscription._id,
                  };
                }
              },
            ),
          );

        console.log(
          "[PUSH] All push operations completed:",
          results,
        );
      }
    } else {
      console.log(
        "[PUSH] No admins found for package:",
        user.pkg,
      );
    }

    // =========================================================
    // SSE LIVE UPDATE
    // =========================================================

    console.log("[SSE] Broadcasting meter-added event...");

    broadcast("meter-added", {
      insertedCount: inserted.length,

      meters: inserted.map((meter) => ({
        ...meter.toObject(),

        supervisor: {
          _id: user._id,
          name: user.name,
          email: user.email,
          pkg: user.pkg,
        },
      })),
    });

    console.log("[SSE] Broadcast completed");

    // =========================================================
    // RESPONSE
    // =========================================================

    console.log(
      "[RESPONSE] Meter creation completed successfully",
    );

    console.log("=================================================");
    console.log("CREATE METER REQUEST FINISHED");
    console.log("=================================================\n");

    return res.status(200).json({
      status: "success",

      message:
        "Meters sent to MIS successfully, Kindly wait for approval.",

      insertedCount: inserted.length,

      data: inserted,
    });
  } catch (error) {
    // =========================================================
    // GLOBAL ERROR
    // =========================================================

    console.error("\n=================================================");
    console.error("CREATE METER REQUEST FAILED");
    console.error("=================================================");

    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    console.error("=================================================\n");

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

module.exports = router;