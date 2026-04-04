const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UserDB = require("../models/user");
const MeterDB = require("../models/meter");
const XLSX = require("xlsx");
const multer = require("multer");

const upload = multer();

const VALID_STATUS = ["active", "pending", "installed", "rejected"];

router.post("/", upload.single("file"), async (req, res) => {
  try {
    // =========================
    // 1. AUTH
    // =========================
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
    } catch {
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

    // =========================
    // 2. FILE CHECK
    // =========================
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    // =========================
    // 3. READ EXCEL (SAFE MODE)
    // =========================
    let rawData;

    try {
      const workbook = XLSX.read(req.file.buffer, {
        type: "buffer",
        raw: true,
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      rawData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: "",
      });
    } catch (err) {
      return res.status(400).json({
        status: "error",
        message: "Invalid Excel file",
      });
    }

    if (!rawData.length) {
      return res.status(400).json({
        status: "error",
        message: "Excel is empty",
      });
    }

    // =========================
    // 4. CLEAN + VALIDATE
    // =========================
    const validData = [];
    const failedRows = [];

    rawData.forEach((item, index) => {
      const row = index + 2; // Excel row number

      let meterNumber = (
        item.meterNumber ||
        item["Meter Number"] ||
        item["Equip Number"] ||
        ""
      )
        .toString()
        .replace(/\s+/g, "") // remove ALL spaces
        .trim();

      let status = (item.status || item["Status"] || "")
        .toString()
        .toLowerCase()
        .trim();

      // validation
      if (!meterNumber || !status) {
        failedRows.push({ row, reason: "Missing data" });
        return;
      }

      if (!/^\d+$/.test(meterNumber)) {
        failedRows.push({ row, meterNumber, reason: "Invalid meterNumber" });
        return;
      }

      if (!VALID_STATUS.includes(status)) {
        failedRows.push({ row, status, reason: "Invalid status" });
        return;
      }

      validData.push({ meterNumber, status });
    });

    if (!validData.length) {
      return res.status(400).json({
        status: "error",
        message: "No valid data found",
        failedRows,
      });
    }

    // =========================
    // 5. DEBUG MATCH CHECK
    // =========================
    const sample = validData[0];
    const testMatch = await MeterDB.findOne({
      meterNumber: sample.meterNumber,
    });

    console.log("DEBUG SAMPLE:", sample);
    console.log("MATCH FOUND:", !!testMatch);

    // =========================
    // 6. BULK UPDATE
    // =========================
    const operations = validData.map((item) => ({
      updateOne: {
        filter: { meterNumber: item.meterNumber },
        update: { $set: { status: item.status } },
        upsert: false,
      },
    }));

    let result;
    try {
      result = await MeterDB.bulkWrite(operations);
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        status: "error",
        message: "Database update failed",
      });
    }

    // =========================
    // 7. RESPONSE
    // =========================
    return res.json({
      status: "success",
      message: "Processing completed",

      totalRows: rawData.length,
      validRows: validData.length,
      failedRowsCount: failedRows.length,

      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,

      failedRows, // IMPORTANT for debugging
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
