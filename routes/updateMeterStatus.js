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

    // Only need to confirm the user exists — fetch minimal fields
    const userExists = await UserDB.exists({ _id: decoded.id });
    if (!userExists) return res.status(401).json({ message: "User not found" });

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

    // ================= CLEAN DATA (single pass) =================
    const cleanedData = new Array(data.length);
    const meterNumberSet = new Set();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      const meterNumber = (row.meterNumber || "")
        .toString()
        .replace(/[\r\n\t\s]/g, "");

      const status = (row.status || "").toString().toLowerCase().trim();
      const installerId = (row.installerId || "").toString().replace(/[\r\n\t]/g, "").trim();
      const remarks = (row.remarks || "").toString().trim();

      cleanedData[i] = { meterNumber, status, installerId, remarks };
      if (meterNumber) meterNumberSet.add(meterNumber);
    }

    const meterNumbers = [...meterNumberSet];

    // ================= SINGLE DB CALL (projected, no full docs) =================
    // Only pull the fields we actually use — cuts payload size and populate cost.
    const meters = await MeterDB.find(
      { meterNumber: { $in: meterNumbers } },
      { meterNumber: 1, supervisor: 1 }
    )
      .populate("supervisor", "name email") // only fetch name/email, not full user doc
      .lean();

    // ================= LOOKUP MAPS =================
    const meterSet = new Set();
    const supervisorMap = new Map(); // email -> { name, meterNumbers: [] }

    for (const m of meters) {
      meterSet.add(m.meterNumber);
      if (m.supervisor?.email) {
        let entry = supervisorMap.get(m.supervisor.email);
        if (!entry) {
          entry = { name: m.supervisor.name || "Supervisor", meterNumbers: [] };
          supervisorMap.set(m.supervisor.email, entry);
        }
        entry.meterNumbers.push(m.meterNumber);
      }
    }

    // ================= BUILD BULK OPERATIONS =================
    const operations = [];
    const errors = [];

    for (const row of cleanedData) {
      const { meterNumber, status, installerId, remarks } = row;
      if (!meterNumber || !status || !installerId || !remarks) continue;

      if (!meterSet.has(meterNumber)) {
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

    // ================= BULK WRITE (unordered = faster, keeps going past bad rows) =================
    const result = await MeterDB.bulkWrite(operations, { ordered: false });

    // ================= RESPOND IMMEDIATELY =================
    // Don't make the client wait on outbound emails — that's pure latency with
    // no bearing on whether the update itself succeeded.
    res.json({
      message: "Updated successfully",
      total: operations.length,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      errors,
    });

    // ================= FIRE-AND-FORGET SUPERVISOR EMAILS =================
    // Runs after the response is sent. Failures are logged, not surfaced to the client.
    Promise.allSettled(
      Array.from(supervisorMap.entries()).map(([email, info]) => {
        const rows = info.meterNumbers.map((mn) => `<li>${mn}</li>`).join("");
        return sendEmail({
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
      })
    ).then((results) => {
      const failed = results.filter(
        (r) => r.status === "rejected" || r.value?.success === false
      );
      if (failed.length) {
        console.error(`${failed.length} supervisor email(s) failed to send`);
      }
    });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Server error" });
    }
  }
});

module.exports = router;