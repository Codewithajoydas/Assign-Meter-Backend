const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UserDB = require("../models/user");
const MeterDB = require("../models/meter");
const XLSX = require("xlsx");
const multer = require("multer");
const { sendEmail } = require("../utils/send-mail");

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
        .trim();

      const remarks = (row.remarks || "").toString().trim();

      return { meterNumber, status, installerId, remarks };
    });

    // ================= UNIQUE METER NUMBERS =================
    const meterNumbers = [
      ...new Set(cleanedData.map((d) => d.meterNumber).filter(Boolean)),
    ];

    // ================= SINGLE DB CALL =================
    const meters = await MeterDB.find({
      meterNumber: { $in: meterNumbers },
    })
      .populate("supervisor")
      .lean();

    // ================= CREATE LOOKUP MAP =================
    const meterMap = new Map();
    const supervisorMap = new Map(); // email -> { name, meterNumbers: [] }

    meters.forEach((m) => {
      meterMap.set(m.meterNumber, true);
      if (m.supervisor?.email) {
        const existing = supervisorMap.get(m.supervisor.email) || {
          name: m.supervisor.name || "Supervisor",
          meterNumbers: [],
        };
        existing.meterNumbers.push(m.meterNumber);
        supervisorMap.set(m.supervisor.email, existing);
      }
    });

    const operations = [];
    const errors = [];

    // ================= BUILD BULK OPERATIONS =================
    for (let row of cleanedData) {
      const { meterNumber, status, installerId, remarks } = row;

      if (!meterNumber || !status || !installerId || !remarks) continue;

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

    // ================= EMAIL SUPERVISORS =================
    const emailResults = await Promise.all(
      Array.from(supervisorMap.entries()).map(async ([email, info]) => {
        const rows = info.meterNumbers
          .map((mn) => `<li>${mn}</li>`)
          .join("");

        const outcome = await sendEmail({
          to: email,
          subject: "Meter Status Update",
          text: `Hi ${info.name}, the following meters under your supervision were updated: ${info.meterNumbers.join(
            ", "
          )}. Total updated: ${info.meterNumbers.length}.`,
          html: `
            <p>Hi ${info.name},</p>
            <p>The following meters under your supervision were updated:</p>
            <ul>${rows}</ul>
            <p><strong>Total updated:</strong> ${info.meterNumbers.length}</p>
          `,
        });

        return { email, ...outcome };
      })
    );

    const emailErrors = emailResults.filter((r) => !r.success);

    return res.json({
      message: "Updated successfully",
      total: operations.length,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      errors,
      emailErrors, // remove this key if you don't want to expose send failures to the client
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;