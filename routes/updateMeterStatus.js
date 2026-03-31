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
    // 1. Token extraction
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authorization header missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2. File check
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    // 3. JWT verification
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    // 4. User check
    const user = await UserDB.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    // 5. Read Excel
    let rawData;
    try {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

      if (!workbook.SheetNames.length) {
        return res.status(400).json({
          status: "error",
          message: "Excel file has no sheets",
        });
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      rawData = XLSX.utils.sheet_to_json(worksheet);
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: "Invalid Excel file format",
      });
    }

    // 6. Empty check
    if (!rawData || rawData.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Excel file is empty",
      });
    }

    // 7. Clean data
    const cleanedData = rawData
      .map((item, index) => ({
        meterNumber: String(item.meterNumber || "").trim(),
        status: String(item.status || "")
          .toLowerCase()
          .trim(),
        row: index + 1,
      }))
      .filter((item) => item.meterNumber && item.status);

    if (cleanedData.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid meterNumber or status found in file",
      });
    }

    // 8. Bulk operation
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

    // 9. Success response
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
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
