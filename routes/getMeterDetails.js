const express = require("express");
const router = express.Router();
const MeterDB = require("../models/meter");
const UserDB = require("../models/user");
const jwt = require("jsonwebtoken");

// status enum: ["active", "pending", "rejected"]

router.get("/:status", async (req, res) => {
  const { status } = req.params;

  try {
    const token = req?.headers?.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserDB.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const meters = await MeterDB.find({
      supervisor: user._id,
      status: status,
    });

    res.status(200).json({
      status: "success",
      count: meters.length,
      data: meters,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

module.exports = router;
