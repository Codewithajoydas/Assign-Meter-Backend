const express = require("express");
const router = express.Router();
const MeterDB = require("../models/meter");
const UserDB = require("../models/user");
const jwt = require("jsonwebtoken");

// ================= ROUTE =================
router.get("/", async (req, res) => {
  const findWrongMeterNumber = await MeterDB.find({
  meterNumber: {
    $not: /^[0-9]+$/,
  },
}).select("meterNumber");

  return res.status(200).json({
    status: "success",
    data: findWrongMeterNumber,
  });
});

module.exports = router;
