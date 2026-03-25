const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UserDB = require("../models/user");
const MeterDB = require("../models/meter");
router.get("/", async (req, res) => {
  const token = req?.headers?.authorization?.split(" ")[1];
  try {
      const meterNumber = req.query.meterNumber;
      console.log(meterNumber)
    if (!meterNumber) {
      return res.status(400).json({
        status: "error",
        message: "meterNumber is required",
      });
    }
    if (!token)
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserDB.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }
    console.log(user);
    const findMeter = await MeterDB.findOne({ meterNumber});
    if (!findMeter)
      return res
        .status(404)
        .json({ status: "error", message: "Meter not found" });
    res.status(200).json({ status: "success", data: { meters: findMeter } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

module.exports = router;
