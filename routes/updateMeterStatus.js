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
    // ================= AUTH =================
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserDB.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ================= READ EXCEL =================
    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      raw: true,
    });

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: "",
    });

    if (!rawData.length) {
      return res.status(400).json({ message: "Empty file" });
    }

    // ================= VALIDATION =================
    const errors = [];
    const validData = [];
    const seen = new Set();

    for (let i = 0; i < rawData.length; i++) {
      const rowNumber = i + 2;

      let meterNumber = (
        rawData[i].meterNumber ||
        rawData[i]["Meter Number"] ||
        rawData[i]["Equip Number"] ||
        ""
      )
        .toString()
        .replace(/\s+/g, "")
        .trim();

      let status = (rawData[i].status || rawData[i]["Status"] || "")
        .toString()
        .toLowerCase()
        .trim();

      // -------- Empty Check --------
      if (!meterNumber || !status) {
        errors.push({ row: rowNumber, reason: "Missing data" });
        continue;
      }

      // -------- Format Check --------
      if (!/^\d+$/.test(meterNumber)) {
        errors.push({ row: rowNumber, meterNumber, reason: "Invalid number" });
        continue;
      }

      // -------- Status Check --------
      if (!VALID_STATUS.includes(status)) {
        errors.push({ row: rowNumber, status, reason: "Invalid status" });
        continue;
      }

      // -------- Duplicate in File --------
      if (seen.has(meterNumber)) {
        errors.push({
          row: rowNumber,
          meterNumber,
          reason: "Duplicate in file",
        });
        continue;
      }

      seen.add(meterNumber);

      validData.push({ meterNumber, status, row: rowNumber });
    }

    // ================= DB EXISTENCE CHECK =================
    const meterNumbers = validData.map((d) => d.meterNumber);

    const existingMeters = await MeterDB.find({
      meterNumber: { $in: meterNumbers },
    }).select("meterNumber");

    const existingSet = new Set(existingMeters.map((m) => m.meterNumber));

    const finalData = [];

    validData.forEach((item) => {
      if (!existingSet.has(item.meterNumber)) {
        errors.push({
          row: item.row,
          meterNumber: item.meterNumber,
          reason: "Not found in DB",
        });
      } else {
        finalData.push(item);
      }
    });

    // ================= BULK UPDATE =================
    let result = { matchedCount: 0, modifiedCount: 0 };

    if (finalData.length > 0) {
      const operations = finalData.map((item) => ({
        updateOne: {
          filter: { meterNumber: item.meterNumber },
          update: { $set: { status: item.status } },
        },
      }));

      result = await MeterDB.bulkWrite(operations);
    }

    // ================= RESPONSE =================
    return res.json({
      message: "Upload processed",

      totalRows: rawData.length,
      validRows: finalData.length,
      errorCount: errors.length,

      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,

      errors, // FULL REPORT
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
