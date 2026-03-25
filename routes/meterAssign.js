const express = require("express");
const router = express.Router();
const MeterDB = require("../models/meter");
const UserDB = require("../models/user");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const token = req?.headers?.authorization?.split(" ")[1];

  const {
    meterNumber,
    equipCategory,
    meterType,
    installationType,
    storeLocation,
    agency,
    installerId,
  } = req.body;

  try {
    if (!token) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserDB.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

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

    const metersData = meterNumber.map((meter) => ({
      meterNumber: meter,
      equipCategory,
      meterType,
      installationType,
      agency,
      installerId,
      supervisor: user._id,
      pkg:user.pkg
    }));
    const existing = await MeterDB.find({
      meterNumber: { $in: meterNumber },
    });

    if (existing.length > 0) {
      return res.status(400).json({
        status: "error",
        message: `Some meters already Sent, duplicates: ${existing.map(
          (m) => m.meterNumber
        )}`,
      });
    }
    await MeterDB.insertMany(metersData);
    res.status(200).json({
      status: "success",
      data: { metersData },
      message: "Meters assigned successfully",
    });
    console.log(metersData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

module.exports = router;
