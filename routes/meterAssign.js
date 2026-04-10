"use strict";

const express = require("express");
const router = express.Router();
const MeterDB = require("../models/meter");
const UserDB = require("../models/user");
const jwt = require("jsonwebtoken");

// ================= HELPERS =================
const cleanMeterNumber = (val) => {
  if (!val) return null;
  return String(val)
    .replace(/[\r\n\t]/g, "") 
    .replace(/\s+/g, "")
    .trim();
};

const isValidMeterNumber = (val) => {
  return /^[0-9]{7}$/.test(val); 
};

router.post("/", async (req, res) => {
  await MeterDB.collection.dropIndex("meterNumber_1");
  try {
    const token = req?.headers?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }

    const user = await UserDB.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // ================= BODY =================
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

    const cleanedMeters = meterNumber.map(cleanMeterNumber).filter((m) => m);

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
      installerId
    }).select("meterNumber");

    if (existing.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Some meters already sent: ${existing
          .map((m) => m.meterNumber)
          .join(", ")}`,
      });
    }

    uniqueMeters.map((m) => {
      if (m.length > 8) {
        return res.status(400).json({
          status: "error",
          message: `Invalid meter number: ${m}`,
        });
      }
    })

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

    // ================= RESPONSE =================
    return res.status(200).json({
      status: "success",
      message: "Meters assigned successfully",
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
