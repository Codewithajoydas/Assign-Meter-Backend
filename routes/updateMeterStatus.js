const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UserDB = require("../models/user");
const MeterDB = require("../models/meter");
const XLSX = require("xlsx");
const multer = require("multer");

const upload = multer();

// POST: Upload Excel & update meter status
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const token = req.cookies?.token;
    const file = req.file;

    // 1. Auth check
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // 2. File check
    if (!file) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a file",
      });
    }

    // 3. Verify user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserDB.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized user",
      });
    }

    // 4. Read Excel file
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(worksheet);

    if (!rawData.length) {
      return res.status(400).json({
        status: "error",
        message: "Excel file is empty",
      });
    }

    // 5. Clean + normalize data
    const cleanedData = rawData
      .map((item) => ({
        meterNumber: String(item.meterNumber || "").trim(),
        status: String(item.status || "")
          .toLowerCase()
          .trim(),
      }))
      .filter((item) => item.meterNumber && item.status);

    if (!cleanedData.length) {
      return res.status(400).json({
        status: "error",
        message: "No valid data found in file",
      });
    }

    // 6. Prepare bulk operations
    const operations = cleanedData.map((item) => ({
      updateOne: {
        filter: { meterNumber: item.meterNumber },
        update: { $set: { status: item.status } },
      },
    }));

    // 7. Execute bulk update
    const result = await MeterDB.bulkWrite(operations);

    // 8. Response
    return res.json({
      status: "success",
      message: "Meter status updated successfully",
      totalRecords: cleanedData.length,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
});

module.exports = router;
