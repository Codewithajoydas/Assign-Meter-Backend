const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UserDB = require("../models/user");
const MeterDB = require("../models/meter");
const XLSX = require("xlsx");
const multer = require("multer");

const upload = multer();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    // 1. Auth check
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authorization header missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    const user = await UserDB.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    // 2. File check
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    // 3. Read Excel SAFELY (no number conversion)
    let rawData;

    try {
      const workbook = XLSX.read(req.file.buffer, {
        type: "buffer",
        raw: true, // IMPORTANT
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      rawData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // force string output
        defval: "", // avoid undefined
      });
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: "Invalid Excel file format",
      });
    }

    if (!rawData || rawData.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Excel file is empty",
      });
    }

    // 4. Normalize keys (handle different column names)
    const cleanedData = rawData
      .map((item, index) => {
        const meterNumber = (
          item.meterNumber ||
          item["Meter Number"] ||
          item["meterNumber"] ||
          item["Equip Number"] ||
          ""
        )
          .toString()
          .trim();

        const status = (item.status || item["Status"] || "")
          .toString()
          .toLowerCase()
          .trim();

        return {
          meterNumber,
          status,
          row: index + 1,
        };
      })
      .filter((item) => {
        // strict validation
        if (!item.meterNumber || !item.status) return false;

        // meter must be digits only (adjust if needed)
        if (!/^\d+$/.test(item.meterNumber)) return false;

        return true;
      });

    if (cleanedData.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid meterNumber or status found",
      });
    }

    // 5. Bulk update
    const operations = cleanedData.map((item) => ({
      updateOne: {
        filter: { meterNumber: item.meterNumber },
        update: { $set: { status: item.status } },
      },
    }));

    let result;
    try {
      result = await MeterDB.bulkWrite(operations);
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: "Database update failed",
      });
    }

    // 6. Response
    return res.json({
      status: "success",
      message: "Meter status updated successfully",
      totalRecords: cleanedData.length,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Unexpected error:", error);

    return res.status(500).json({
      status: "error",
      message: "Unexpected server error",
    });
  }
});

module.exports = router;
