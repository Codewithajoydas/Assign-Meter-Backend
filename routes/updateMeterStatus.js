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
    // ================= AUTH =================
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

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

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, {
      raw: true,
      defval: "",
    });

    if (!data.length) {
      return res.status(400).json({ message: "Empty file" });
    }

    // ================= CLEAN DATA =================
    const cleanedData = data.map((row) => {
      const meterNumber = (row.meterNumber || "")
        .toString()
        .replace(/[\r\n\t]/g, "")
        .replace(/\s+/g, "")
        .trim();

      const status = (row.status || "").toString().toLowerCase().trim();
      const installerId = (row.installerId || "")
        .toString()
        .replace(/[\r\n\t]/g, "")
      const remarks = (row.remarks || "")

      return { meterNumber, status, installerId, remarks };
    });

    // ================= UNIQUE METER NUMBERS =================
    const meterNumbers = [
      ...new Set(cleanedData.map((d) => d.meterNumber).filter(Boolean)),
    ];

    // ================= SINGLE DB CALL =================
    const meters = await MeterDB.find({
      meterNumber: { $in: meterNumbers },
    }).lean();

    // ================= CREATE LOOKUP MAP =================
    const meterMap = new Map();
    meters.forEach((m) => {
      meterMap.set(m.meterNumber, true);
    });

    const operations = [];
    const errors = [];

    // ================= BUILD BULK OPERATIONS =================
    for (let row of cleanedData) {
      const { meterNumber, status, installerId, remarks } = row;

      if (!meterNumber || !status || !installerId||!remarks) continue;

      if (!meterMap.has(meterNumber)) {
        errors.push({ meterNumber, message: "Meter not found" });
        continue;
      }

      operations.push({
        updateOne: {
          filter: { meterNumber, installerId },
          update: { $set: { status, remarks } },
        },
      });
    }

    if (!operations.length) {
      return res.status(400).json({ message: "No valid data found", errors });
    }

    // ================= BULK WRITE =================
    const result = await MeterDB.bulkWrite(operations);

    return res.json({
      message: "Updated successfully",
      total: operations.length,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      errors, // optional
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
