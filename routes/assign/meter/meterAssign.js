const express = require("express");
const router = express.Router();
const MeterDB = require("../../../models/meter");
const { broadcast } = require("../../../config/sse.config");
const isValidMeterNumber = require("../../../utils/isValidMeterNumber");
const cleanMeterNumber = require("../../../utils/cleanMeterNumber");
const AuthMiddleware = require("../../../middleware/authentication");
const { allowRoles } = require("../../../middleware/rbac");

router.use(AuthMiddleware);
router.use(allowRoles("admin", "superadmin", "supervisor"));
router.post("/", async (req, res) => {
  try {
    const user = req?.user;
    if (!user) {
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

    if (
      !meterNumber ||
      !equipCategory ||
      !meterType ||
      !installationType ||
      !storeLocation ||
      !agency ||
      !installerId
    ) {
      return res.status(400).json({
        status: "error",
        message: "Please provide all details",
      });
    }

    if (!Array.isArray(meterNumber)) {
      return res.status(400).json({
        status: "error",
        message: "meterNumber must be an array",
      });
    }

    const cleanedMeters = meterNumber.map(cleanMeterNumber).filter(Boolean);

    if (cleanedMeters.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid meter numbers provided",
      });
    }

    const invalidMeters = cleanedMeters.filter((m) => !isValidMeterNumber(m));

    if (invalidMeters.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Invalid meter numbers: ${invalidMeters.join(", ")}`,
      });
    }

    const uniqueMeters = [...new Set(cleanedMeters)];

    const existing = await MeterDB.find({
      meterNumber: { $in: uniqueMeters },
      agency,
      installerId,
    }).select("meterNumber");

    if (existing.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Some meters already sent: ${existing
          .map((m) => m.meterNumber)
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

    // ================= INSERT =================
    const inserted = await MeterDB.insertMany(metersData, {
      ordered: false,
    });

    // ================= SEND LIVE UPDATE =================
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
    // ================= RESPONSE =================
    return res.status(200).json({
      status: "success",
      message: "Meters sent to MIS successfully, Kindly wait for approval.",
      insertedCount: inserted.length,
      data: inserted,
    });
  } catch (error) {
    console.error("Server Error:", error);

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

module.exports = router;
