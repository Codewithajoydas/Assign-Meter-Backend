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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UserDB.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

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
    const operations = [];

    const errors = [];
    for (let row of data) {
      console.log(row);
      const meterNumber = (row.meterNumber || "")
        .toString()
        .replace(/[\r\n\t]/g, "")
        .replace(/\s+/g, "")
        .trim();
      const findMeter = await MeterDB.findOne({
        meterNumber: { $regex: `^${meterNumber.trim()}$`, $options: "i" },
      });
      if (!findMeter) {
        errors.push({ meterNumber, message: "Meter not found" });
        continue;
      } else {
        errors.push({ meterNumber, message: "Meter found" });
      }
      const status = (row.status || "").toString().toLowerCase().trim();
      // skip bad rows (no strict validation)
      if (!meterNumber || !status) continue;

      operations.push({
        updateOne: {
          filter: { meterNumber },
          update: { $set: { status } },
        },
      });
    }

    if (errors.length) console.log(errors);

    if (!operations.length) {
      return res.status(400).json({ message: "No valid data found" });
    }

    const result = await MeterDB.bulkWrite(operations);

    return res.json({
      message: "Updated successfully",
      total: operations.length,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
