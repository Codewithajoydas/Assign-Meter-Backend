const express = require("express");
const router = express.Router();
const MeterDB = require("../../../models/meter");
const UserDB = require("../../../models/user");
const jwt = require("jsonwebtoken");

router.delete("/", async (req, res) => {
  try {
    // ---------------- TOKEN ----------------
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Token missing",
      });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }
    const user = await UserDB.findById(decoded.id).lean();
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }
    const { meters } = req.body;
  if (!Array.isArray(meters) || meters.length === 0) {
  return res.status(400).json({
    status: "error",
    message: "Please select at least one meter",
  });
}
    let deletedMeters = [];
    try {
       deletedMeters = await MeterDB.deleteMany({ _id: { $in: meters } });
    } catch (error) {
      console.error("Mongoose Error:", error);
      return res.status(500).json({
        status: "error",
        message: "DATABASE ERROR",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Meters deleted successfully",
      data: deletedMeters,
    });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

module.exports = router;
